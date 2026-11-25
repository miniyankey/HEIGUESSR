import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import express from "express";
import { cloudinaryConfig } from "../config.js";
import { authenticate } from "../middlewares/auth.js";
import Upload from "../models/upload.js";

const router = express.Router();

cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret,
  secure: true,
});

const FOLDER = "heiguessr";
const ALLOWED_FORMATS = ["jpg", "png", "webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// Every file of a user lives under heiguessr/<userId>/<uuid>.
function userPrefix(userId) {
  return `${FOLDER}/${userId}/`;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Returns a signature allowing the client to upload ONE image directly to
 * Cloudinary. The public_id is chosen by the server and is part of the
 * signature, so the client cannot change where the file goes, nor its format.
 */
router.post("/signature", authenticate, (req, res) => {
  const params = {
    timestamp: Math.round(Date.now() / 1000),
    public_id: `${userPrefix(req.currentUserId)}${randomUUID()}`,
    allowed_formats: ALLOWED_FORMATS.join(","),
    overwrite: "false",
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    cloudinaryConfig.apiSecret,
  );

  // The client must send every entry of `params` unchanged, plus `file`,
  // `api_key` and `signature`.
  res.send({
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    apiKey: cloudinaryConfig.apiKey,
    signature,
    params,
  });
});

/**
 * Registers in the database a file the client has uploaded to Cloudinary.
 * Only the publicId is taken from the client: all other data comes from
 * Cloudinary itself, so the client cannot forge the URL, size, etc.
 */
router.post("/", authenticate, async (req, res) => {
  const { publicId } = req.body ?? {};
  const ownPublicId = new RegExp(
    `^${escapeRegExp(userPrefix(req.currentUserId))}[0-9a-f-]{36}$`,
  );

  if (typeof publicId !== "string" || !ownPublicId.test(publicId)) {
    return res
      .status(422)
      .send({ message: "A valid publicId belonging to you is required" });
  }

  // Ask Cloudinary: confirms the file exists and gives trusted metadata
  let resource;
  try {
    resource = await cloudinary.api.resource(publicId, {
      resource_type: "image",
      type: "upload",
    });
  } catch (err) {
    if (err.error?.http_code === 404 || err.http_code === 404) {
      return res.status(404).send({ message: "File not found on Cloudinary" });
    }
    throw err; // Express 5 forwards it to the error handler
  }

  // Cloudinary cannot cap the size of a signed upload: check it here and
  // remove the file if it does not respect the rules.
  if (
    !ALLOWED_FORMATS.includes(resource.format) ||
    resource.bytes > MAX_BYTES
  ) {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
    return res.status(422).send({
      message: `Only ${ALLOWED_FORMATS.join(", ")} images up to ${MAX_BYTES / 1024 / 1024} MB are accepted`,
    });
  }

  try {
    const upload = await Upload.create({
      publicId: resource.public_id,
      url: resource.secure_url,
      format: resource.format,
      bytes: resource.bytes,
      width: resource.width,
      height: resource.height,
      owner: req.currentUserId,
    });
    return res.status(201).send(upload);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .send({ message: "This file is already registered" });
    }
    throw err;
  }
});

export default router;
