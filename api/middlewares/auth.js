import createError from "http-errors";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config.js";
import User from "../models/user.js";

export function authenticate(req, res, next) {
  // Ensure the header is present and contains a bearer token.
  const authorization = req.get("Authorization");
  const match = authorization?.match(/^Bearer (.+)$/i);
  if (!match) {
    return unauthorized(res, "A bearer token is required");
  }
  // Extract and verify the JWT.
  try {
    const payload = jwt.verify(match[1], jwtSecret);
    // Pass the ID of the authenticated user to the next middleware.
    req.currentUserId = payload.sub;
    next();
  } catch {
    unauthorized(res, "Your token is invalid or has expired");
  }
}

/**
 * Loads the authenticated user into req.currentUser (after authenticate).
 * A valid token of a deleted user gives 401.
 */
export async function loadCurrentUser(req, res, next) {
  const user = await User.findById(req.currentUserId);
  if (!user) {
    return unauthorized(res, "Your account no longer exists");
  }
  req.currentUser = user;
  next();
}

/**
 * Only lets admins through (403 otherwise). The role is read from the
 * database, not from the token, so removing a role takes effect immediately.
 */
export function requireAdmin(req, res, next) {
  if (req.currentUser?.role !== "admin") {
    throw createError(403, "Only admins can perform this operation");
  }
  next();
}

/** Middleware chain for admin-only routes. */
export const authenticateAdmin = [authenticate, loadCurrentUser, requireAdmin];

function unauthorized(res, message) {
  // A 401 response must tell the client how to authenticate.
  res.status(401).set("WWW-Authenticate", "Bearer").send({ message });
}
