import assert from "node:assert/strict";
import { describe, it } from "node:test";
import supertest from "supertest";
import app from "../app.js";
import { authHeader, createAdmin, createUser, useTestDatabase } from "./helpers.js";

useTestDatabase();

describe("GET /users/me", () => {
  it("returns the profile of the authenticated player", async () => {
    const user = await createUser({ username: "alice", firstname: "Alice" });

    const res = await supertest(app)
      .get("/users/me")
      .set(authHeader(user))
      .expect(200)
      .expect("Content-Type", /json/);

    assert.equal(res.body._id, user.id);
    assert.equal(res.body.username, "alice");
    assert.equal(res.body.firstname, "Alice");
    assert.equal(res.body.role, "player");
    assert.equal(res.body.hash, undefined);
    assert.equal(res.body.__v, undefined);
  });

  it("tells an admin they are admin", async () => {
    const admin = await createAdmin();

    const res = await supertest(app).get("/users/me").set(authHeader(admin)).expect(200);

    assert.equal(res.body.role, "admin");
  });

  it("returns 401 without a token", async () => {
    const res = await supertest(app).get("/users/me").expect(401);

    assert.equal(res.headers["www-authenticate"], "Bearer");
  });

  it("returns 401 when the account was deleted", async () => {
    const user = await createUser();
    const header = authHeader(user);
    await user.deleteOne();

    const res = await supertest(app).get("/users/me").set(header).expect(401);

    assert.equal(res.body.message, "Your account no longer exists");
  });
});
