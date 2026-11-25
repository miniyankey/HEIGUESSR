// Helpers shared by the resource routers (floors, spots, ...).
import createError from "http-errors";
import mongoose from "mongoose";

/**
 * Returns a middleware loading the document of `:id` into req[key], or
 * responding 404 with `notFoundMessage`. An invalid id is a CastError, which
 * the error handler also turns into 404.
 */
export function loadDocument(Model, key, notFoundMessage) {
  return async function (req, res, next) {
    const document = await Model.findById(req.params.id);
    if (!document) {
      throw createError(404, notFoundMessage);
    }
    req[key] = document;
    next();
  };
}

/**
 * Copies only the allowed fields of a request body (whitelist), so a client
 * cannot set _id, createdBy, timestamps...
 */
export function pickFields(body, fields) {
  const picked = {};
  for (const field of fields) {
    if (body?.[field] !== undefined) {
      picked[field] = body[field];
    }
  }
  return picked;
}

/** Reads an optional query parameter given at most once (400 otherwise). */
export function optionalQueryString(req, name) {
  const value = req.query[name];
  if (value !== undefined && typeof value !== "string") {
    throw createError(400, `Query parameter "${name}" must be given only once`);
  }
  return value;
}

/** Reads an optional query parameter that must be an ObjectId (400 otherwise). */
export function optionalQueryId(req, name) {
  const value = optionalQueryString(req, name);
  if (value !== undefined && !mongoose.isValidObjectId(value)) {
    throw createError(400, `Query parameter "${name}" must be a valid ID`);
  }
  return value;
}
