// The set-role script is the only way to create an admin.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import User from "../models/user.js";
import { setRole } from "../scripts/set-role.js";
import { createAdmin, createUser, useTestDatabase } from "./helpers.js";

useTestDatabase();

describe("setRole", () => {
  it("promotes a player to admin", async () => {
    const user = await createUser({ username: "alice" });

    await setRole("alice", "admin");

    assert.equal((await User.findById(user.id)).role, "admin");
  });

  it("demotes an admin to player", async () => {
    const admin = await createAdmin({ username: "bob" });

    await setRole("bob", "player");

    assert.equal((await User.findById(admin.id)).role, "player");
  });

  it("rejects an unknown role", async () => {
    const user = await createUser({ username: "alice" });

    await assert.rejects(setRole("alice", "superuser"), {
      name: "ValidationError",
    });
    assert.equal((await User.findById(user.id)).role, "player");
  });

  it("rejects an unknown username", async () => {
    await assert.rejects(setRole("nobody", "admin"), /No user named "nobody"/);
  });
});
