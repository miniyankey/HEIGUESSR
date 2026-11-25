import assert from "node:assert/strict";
import { describe, it } from "node:test";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supertest from "supertest";
import app from "../app.js";
import { jwtSecret } from "../config.js";
import User from "../models/user.js";
import { DEFAULT_PASSWORD, createUser, useTestDatabase } from "./helpers.js";

useTestDatabase();

const validRegistration = {
  username: "alice_42",
  email: "Alice@Example.com",
  password: "correct-horse",
  firstname: "Alice",
  lastname: "Martin",
};

describe("POST /auth/register", () => {
  it("creates the user and returns a token for them", async () => {
    const res = await supertest(app)
      .post("/auth/register")
      .send(validRegistration)
      .expect(201)
      .expect("Content-Type", /json/);

    const user = await User.findOne({ username: "alice_42" }).select("+hash");
    assert.ok(user, "user must be saved");
    assert.equal(user.email, "alice@example.com");
    assert.equal(user.firstname, "Alice");
    assert.ok(await bcrypt.compare("correct-horse", user.hash));
    assert.equal(jwt.verify(res.body.token, jwtSecret).sub, user.id);
  });

  it("ignores a role sent by the client: new users are players", async () => {
    await supertest(app)
      .post("/auth/register")
      .send({ ...validRegistration, role: "admin" })
      .expect(201);

    const user = await User.findOne({ username: "alice_42" });
    assert.equal(user.role, "player");
  });

  it("returns 422 with a message per missing required field", async () => {
    const res = await supertest(app).post("/auth/register").send({}).expect(422);

    assert.equal(res.body.message, "Validation failed");
    assert.deepEqual(Object.keys(res.body.errors).sort(), [
      "email",
      "password",
      "username",
    ]);
    assert.equal(await User.countDocuments(), 0);
  });

  it("returns 422 for a short password together with other invalid fields", async () => {
    const res = await supertest(app)
      .post("/auth/register")
      .send({ ...validRegistration, username: "a!", password: "short" })
      .expect(422);

    assert.match(res.body.errors.password, /at least 8 characters/);
    assert.ok(res.body.errors.username);
    assert.equal(res.body.errors.hash, undefined);
  });

  it("returns 422 for an invalid email", async () => {
    const res = await supertest(app)
      .post("/auth/register")
      .send({ ...validRegistration, email: "not-an-email" })
      .expect(422);

    assert.deepEqual(Object.keys(res.body.errors), ["email"]);
  });

  it("returns 409 when the username is already used", async () => {
    await createUser({ username: "alice_42" });

    const res = await supertest(app)
      .post("/auth/register")
      .send(validRegistration)
      .expect(409);

    assert.equal(res.body.message, "username already in use");
    assert.equal(await User.countDocuments(), 1);
  });

  it("returns 409 when the email is already used", async () => {
    await createUser({ email: "alice@example.com" });

    const res = await supertest(app)
      .post("/auth/register")
      .send(validRegistration)
      .expect(409);

    assert.equal(res.body.message, "email already in use");
  });

  it("returns 400 for a malformed JSON body", async () => {
    await supertest(app)
      .post("/auth/register")
      .set("Content-Type", "application/json")
      .send('{"username": ')
      .expect(400);
  });
});

describe("POST /auth/login", () => {
  it("returns a token for valid credentials", async () => {
    const user = await createUser({ username: "bob" });

    const res = await supertest(app)
      .post("/auth/login")
      .send({ username: "bob", password: DEFAULT_PASSWORD })
      .expect(200)
      .expect("Content-Type", /json/);

    const payload = jwt.verify(res.body.token, jwtSecret);
    assert.equal(payload.sub, user.id);
    // expires in 7 days
    assert.equal(payload.exp - payload.iat, 7 * 24 * 60 * 60);
  });

  it("returns 401 for a wrong password", async () => {
    await createUser({ username: "bob" });

    const res = await supertest(app)
      .post("/auth/login")
      .send({ username: "bob", password: "wrong-password" })
      .expect(401);

    assert.equal(res.body.message, "Invalid name or password");
    assert.equal(res.body.token, undefined);
  });

  it("returns 401 for an unknown username", async () => {
    const res = await supertest(app)
      .post("/auth/login")
      .send({ username: "nobody", password: DEFAULT_PASSWORD })
      .expect(401);

    assert.equal(res.body.message, "Invalid name or password");
  });

  it("returns 422 when the password is missing", async () => {
    await supertest(app).post("/auth/login").send({ username: "bob" }).expect(422);
  });

  it("returns 422 when the body is empty", async () => {
    await supertest(app).post("/auth/login").expect(422);
  });
});
