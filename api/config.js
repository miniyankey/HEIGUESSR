export const port = Number(process.env.PORT ?? 3000);

// Hides internal error messages from responses in production.
export const isProduction = process.env.NODE_ENV === "production";

export const databaseUrl = process.env.MONGODB_URI ?? "mongodb://127.0.0.1/api";

if (process.env.MONGODB_URI) {
  try {
    new URL(process.env.MONGODB_URI);
  } catch (error) {
    throw new TypeError(
      "Environment variable $MONGODB_URI must be a valid URL",
    );
  }
}

if (process.env.PORT) {
  const parsedPort = Number(process.env.PORT);
  if (!Number.isInteger(parsedPort)) {
    throw new TypeError("Environment variable $PORT must be an integer");
  } else if (parsedPort < 1 || parsedPort > 65535) {
    throw new TypeError(
      "Environment variable $PORT must be a valid port number",
    );
  }
}

export const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("Environment variable $JWT_SECRET must be set");
}

export const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};
for (const name of [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
]) {
  if (!process.env[name]) {
    throw new Error(`Environment variable ${name} must be set`);
  }
}

// Comma-separated list of origins allowed to call the API from a browser.
export const corsOrigins = (
  process.env.CORS_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
