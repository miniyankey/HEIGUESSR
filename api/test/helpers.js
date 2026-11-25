import { after, before, beforeEach } from "node:test";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { jwtSecret } from "../config.js";
import User from "../models/user.js";

/**
 * Gives the current test file its own empty in-memory MongoDB: started once
 * for the file, emptied before each test, stopped at the end.
 */
export function useTestDatabase() {
  let mongoServer;

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    // Build unique indexes now, so duplicate checks behave as in production
    await mongoose.connection.syncIndexes();
  });

  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
}

export const DEFAULT_PASSWORD = "correct-horse";

let userCounter = 0;

/** Creates a user directly in the database (not through the API). */
export async function createUser(properties = {}) {
  userCounter += 1;
  const { password = DEFAULT_PASSWORD, ...rest } = properties;
  return User.create({
    username: `user_${userCounter}`,
    email: `user${userCounter}@example.com`,
    hash: await bcrypt.hash(password, 4), // low cost: faster tests
    ...rest,
  });
}

/** Returns a valid JWT for the user, as POST /auth/login would. */
export function tokenFor(user, options = { expiresIn: "1h" }) {
  return jwt.sign({ sub: user.id }, jwtSecret, options);
}

/** Authorization header for supertest's .set(). */
export function authHeader(user) {
  return { Authorization: `Bearer ${tokenFor(user)}` };
}
