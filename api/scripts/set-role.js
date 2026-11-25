// Gives a role to an existing user. Admins cannot be created through the API.
//
//   npm run set-role -- <username> <player|admin>
//
// Uses MONGODB_URI (from .env with npm run, or from the environment).
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { databaseUrl } from "../config.js";
import User from "../models/user.js";

/** Sets the role of a user. Throws if the user or the role is unknown. */
export async function setRole(username, role) {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error(`No user named "${username}"`);
  }
  user.role = role;
  await user.save(); // runs the enum validation of the role
  return user;
}

async function main([username, role]) {
  if (!username || !role) {
    console.error("Usage: npm run set-role -- <username> <player|admin>");
    process.exitCode = 1;
    return;
  }
  await mongoose.connect(databaseUrl);
  try {
    const user = await setRole(username, role);
    console.log(`${user.username} is now ${user.role}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

// Only run when executed directly, not when imported by the tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
