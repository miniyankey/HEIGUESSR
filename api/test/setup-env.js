// Loaded with `node --import` before any test file, so config.js finds every
// variable it requires. Tests never use the local .env, the real database or
// the real Cloudinary account.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";
process.env.CORS_ORIGIN = "http://localhost:5173";
delete process.env.MONGODB_URI;
