// Shared middlewares, tested through a small Express app that uses them the
// same way the real routers will.
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import express from "express";
import createError from "http-errors";
import mongoose from "mongoose";
import supertest from "supertest";
import app from "../app.js";
import { errorHandler, notFound } from "../middlewares/errors.js";
import { paginate, setPaginationHeaders } from "../middlewares/pagination.js";

const testApp = express();
testApp.get("/items", paginate, (req, res) => {
  setPaginationHeaders(res, req.pagination, 42);
  res.send(req.pagination);
});
testApp.get("/validation-error", () => {
  const error = new mongoose.Error.ValidationError();
  error.addError("name", new mongoose.Error.ValidatorError({ message: "Name is required" }));
  throw error;
});
testApp.get("/cast-error", () => {
  throw new mongoose.Error.CastError("ObjectId", "not-an-id", "_id");
});
testApp.get("/duplicate", () => {
  throw Object.assign(new Error("E11000"), { code: 11000, keyPattern: { email: 1 } });
});
testApp.get("/forbidden", () => {
  throw createError(403, "Only admins can do this");
});
testApp.get("/crash", () => {
  throw new Error("Something broke");
});
testApp.use(notFound);
testApp.use(errorHandler);

describe("paginate", () => {
  it("uses page 1 and 20 items per page by default", async () => {
    const res = await supertest(testApp).get("/items").expect(200);

    assert.deepEqual(res.body, { page: 1, pageSize: 20, skip: 0 });
    assert.equal(res.headers["pagination-page"], "1");
    assert.equal(res.headers["pagination-page-size"], "20");
    assert.equal(res.headers["pagination-total"], "42");
  });

  it("computes the number of items to skip from page and pageSize", async () => {
    const res = await supertest(testApp).get("/items?page=3&pageSize=10").expect(200);

    assert.deepEqual(res.body, { page: 3, pageSize: 10, skip: 20 });
  });

  it("returns 400 for a page that is not a positive integer", async () => {
    const res = await supertest(testApp).get("/items?page=0").expect(400);

    assert.match(res.body.message, /"page" must be a positive integer/);
  });

  it("returns 400 for a non-numeric pageSize", async () => {
    await supertest(testApp).get("/items?pageSize=abc").expect(400);
  });

  it("returns 400 for a pageSize above 100", async () => {
    const res = await supertest(testApp).get("/items?pageSize=101").expect(400);

    assert.match(res.body.message, /at most 100/);
  });
});

describe("errorHandler", () => {
  it("turns a Mongoose validation error into 422 with one message per field", async () => {
    const res = await supertest(testApp).get("/validation-error").expect(422);

    assert.deepEqual(res.body, {
      message: "Validation failed",
      errors: { name: "Name is required" },
    });
  });

  it("turns an invalid ObjectId into 404", async () => {
    await supertest(testApp).get("/cast-error").expect(404, { message: "Not Found" });
  });

  it("turns a duplicate key into 409 naming the field", async () => {
    await supertest(testApp)
      .get("/duplicate")
      .expect(409, { message: "email already in use" });
  });

  it("keeps the status and message of an HTTP error", async () => {
    await supertest(testApp)
      .get("/forbidden")
      .expect(403, { message: "Only admins can do this" });
  });

  it("returns 500 for an unexpected error", async () => {
    const consoleError = mock.method(console, "error", () => {});

    await supertest(testApp).get("/crash").expect(500);

    assert.equal(consoleError.mock.callCount(), 1);
    consoleError.mock.restore();
  });
});

describe("notFound", () => {
  it("returns 404 in JSON for an unknown route of the API", async () => {
    await supertest(app).get("/unknown").expect(404, { message: "Not Found" });
  });
});

describe("GET /api-docs", () => {
  it("serves the documentation", async () => {
    const res = await supertest(app).get("/api-docs/").expect(200);

    assert.match(res.text, /swagger-ui/);
  });

  it("is where the root URL redirects", async () => {
    await supertest(app).get("/").expect(302).expect("Location", "/api-docs");
  });
});
