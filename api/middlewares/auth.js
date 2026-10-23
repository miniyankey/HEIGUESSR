import jwt from "jsonwebtoken";
import { jwtSecret } from "../config.js";

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
function unauthorized(res, message) {
  // A 401 response must tell the client how to authenticate.
  res.status(401).set("WWW-Authenticate", "Bearer").send({ message });
}
