import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it, mock } from "node:test";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import supertest from "supertest";
import app from "../app.js";
import { jwtSecret } from "../config.js";
import Upload from "../models/upload.js";
import { authHeader, createUser, useTestDatabase } from "./helpers.js";

useTestDatabase();

// Cloudinary is never called for real: each test mocks what it needs.
afterEach(() => mock.restoreAll());

function publicIdOf(user) {
  return `heiguessr/${user.id}/${randomUUID()}`;
}

/** What Cloudinary's Admin API returns for an uploaded image. */
function cloudinaryResource(publicId, overrides = {}) {
  return {
    public_id: publicId,
    secure_url: `https://res.cloudinary.com/test-cloud/image/upload/v1/${publicId}.png`,
    format: "png",
    bytes: 2048,
    width: 800,
    height: 600,
    ...overrides,
  };
}

describe("POST /uploads/signature", () => {
  it("returns a valid signature for a public_id owned by the user", async () => {
    const user = await createUser();

    const res = await supertest(app)
      .post("/uploads/signature")
      .set(authHeader(user))
      .expect(200);

    const { uploadUrl, apiKey, signature, params } = res.body;
    assert.equal(uploadUrl, "https://api.cloudinary.com/v1_1/test-cloud/image/upload");
    assert.equal(apiKey, "test-api-key");
    assert.match(params.public_id, new RegExp(`^heiguessr/${user.id}/[0-9a-f-]{36}$`));
    assert.equal(params.allowed_formats, "jpg,png,webp");
    assert.equal(params.overwrite, "false");
    assert.ok(Math.abs(params.timestamp - Date.now() / 1000) < 60);
    assert.equal(signature, cloudinary.utils.api_sign_request(params, "test-api-secret"));
  });

  it("returns 401 without a token", async () => {
    const res = await supertest(app).post("/uploads/signature").expect(401);

    assert.equal(res.headers["www-authenticate"], "Bearer");
  });

  it("returns 401 with an expired token", async () => {
    const user = await createUser();
    const expired = jwt.sign({ sub: user.id, exp: 1 }, jwtSecret);

    await supertest(app)
      .post("/uploads/signature")
      .set("Authorization", `Bearer ${expired}`)
      .expect(401);
  });
});

describe("POST /uploads", () => {
  it("saves the image with the metadata given by Cloudinary", async () => {
    const user = await createUser();
    const publicId = publicIdOf(user);
    const resource = mock.method(cloudinary.api, "resource", async () =>
      cloudinaryResource(publicId),
    );

    const res = await supertest(app)
      .post("/uploads")
      .set(authHeader(user))
      .send({ publicId, url: "https://evil.example.com/fake.png", bytes: 1 })
      .expect(201);

    assert.equal(resource.mock.callCount(), 1);
    assert.equal(resource.mock.calls[0].arguments[0], publicId);
    assert.equal(res.body.publicId, publicId);
    assert.equal(res.body.owner, user.id);
    // Data sent by the client is ignored
    assert.equal(res.body.url, cloudinaryResource(publicId).secure_url);
    assert.equal(res.body.bytes, 2048);
    assert.equal(await Upload.countDocuments({ publicId }), 1);
  });

  it("returns 422 for a publicId belonging to another user", async () => {
    const user = await createUser();
    const other = await createUser();
    const resource = mock.method(cloudinary.api, "resource", async () => ({}));

    await supertest(app)
      .post("/uploads")
      .set(authHeader(user))
      .send({ publicId: publicIdOf(other) })
      .expect(422);

    assert.equal(resource.mock.callCount(), 0);
  });

  it("returns 422 for a malformed publicId", async () => {
    const user = await createUser();

    await supertest(app)
      .post("/uploads")
      .set(authHeader(user))
      .send({ publicId: `heiguessr/${user.id}/../other` })
      .expect(422);
  });

  it("returns 422 when publicId is missing", async () => {
    const user = await createUser();

    await supertest(app).post("/uploads").set(authHeader(user)).send({}).expect(422);
  });

  it("returns 422 and deletes the image when it is too large", async () => {
    const user = await createUser();
    const publicId = publicIdOf(user);
    mock.method(cloudinary.api, "resource", async () =>
      cloudinaryResource(publicId, { bytes: 11 * 1024 * 1024 }),
    );
    const destroy = mock.method(cloudinary.uploader, "destroy", async () => ({}));

    await supertest(app)
      .post("/uploads")
      .set(authHeader(user))
      .send({ publicId })
      .expect(422);

    assert.equal(destroy.mock.callCount(), 1);
    assert.equal(destroy.mock.calls[0].arguments[0], publicId);
    assert.equal(await Upload.countDocuments(), 0);
  });

  it("returns 422 and deletes the image when its format is not allowed", async () => {
    const user = await createUser();
    const publicId = publicIdOf(user);
    mock.method(cloudinary.api, "resource", async () =>
      cloudinaryResource(publicId, { format: "gif" }),
    );
    const destroy = mock.method(cloudinary.uploader, "destroy", async () => ({}));

    await supertest(app)
      .post("/uploads")
      .set(authHeader(user))
      .send({ publicId })
      .expect(422);

    assert.equal(destroy.mock.callCount(), 1);
  });

  it("returns 404 when the image does not exist on Cloudinary", async () => {
    const user = await createUser();
    mock.method(cloudinary.api, "resource", async () => {
      throw { error: { message: "Resource not found", http_code: 404 } };
    });

    await supertest(app)
      .post("/uploads")
      .set(authHeader(user))
      .send({ publicId: publicIdOf(user) })
      .expect(404);
  });

  it("returns 409 when the image is already registered", async () => {
    const user = await createUser();
    const publicId = publicIdOf(user);
    await Upload.create({
      publicId,
      url: "https://res.cloudinary.com/x.png",
      owner: user.id,
    });
    mock.method(cloudinary.api, "resource", async () => cloudinaryResource(publicId));

    await supertest(app)
      .post("/uploads")
      .set(authHeader(user))
      .send({ publicId })
      .expect(409);

    assert.equal(await Upload.countDocuments(), 1);
  });

  it("returns 500 when Cloudinary fails for another reason", async () => {
    const user = await createUser();
    mock.method(cloudinary.api, "resource", async () => {
      throw new Error("Cloudinary is down");
    });
    // The error handler logs 500 errors: keep the test output clean
    mock.method(console, "error", () => {});

    await supertest(app)
      .post("/uploads")
      .set(authHeader(user))
      .send({ publicId: publicIdOf(user) })
      .expect(500);
  });

  it("returns 401 without a token", async () => {
    await supertest(app)
      .post("/uploads")
      .send({ publicId: `heiguessr/${new mongoose.Types.ObjectId()}/${randomUUID()}` })
      .expect(401);
  });
});
