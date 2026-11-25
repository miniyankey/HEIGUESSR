import createError from "http-errors";
import mongoose from "mongoose";
import { isProduction } from "../config.js";

/** Forwards any request that matched no route as a 404 Not Found. */
export function notFound(req, res, next) {
  next(createError(404, "Not Found"));
}

/**
 * Single place where errors become HTTP responses, so routes can simply throw
 * (Express 5 forwards rejected promises here).
 *
 * - Mongoose validation error -> 422 { message, errors: { field: message } }
 * - Invalid ObjectId (CastError) -> 404, the resource cannot exist
 * - Duplicate key (unique index) -> 409 { message: "<field> already in use" }
 * - http-errors / body-parser errors -> their own status
 * - Anything else -> 500, without internal details in production
 */
// eslint-disable-next-line no-unused-vars -- Express needs 4 arguments
export function errorHandler(err, req, res, next) {
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = {};
    for (const [path, error] of Object.entries(err.errors)) {
      errors[path] = error.message;
    }
    return res.status(422).send({ message: "Validation failed", errors });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).send({ message: "Not Found" });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "value";
    return res.status(409).send({ message: `${field} already in use` });
  }

  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) {
    console.error(err);
  }

  // http-errors marks client errors (4xx) as safe to expose
  const exposeMessage = err.expose || !isProduction;
  res.status(status).send({
    message: exposeMessage ? err.message : "Internal Server Error",
  });
}
