import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import mongoose from "mongoose";
import supertest from "supertest";
import app from "../app.js";
import Floor from "../models/floor.js";
import Spot from "../models/spot.js";
import {
  authHeader,
  createAdmin,
  createUpload,
  createUser,
  useTestDatabase,
} from "./helpers.js";

useTestDatabase();

let admin;
let player;
let photo;
let cheseaux;
let stRoch;

beforeEach(async () => {
  admin = await createAdmin();
  player = await createUser();
  photo = await createUpload(admin);
  const plan = await createUpload(admin);
  cheseaux = await Floor.create({ building: "Cheseaux", level: 1, letters: ["C"], plan: plan.id });
  stRoch = await Floor.create({ building: "St-Roch", level: 0, letters: ["B"], plan: plan.id });
});

function createSpot(properties = {}) {
  return Spot.create({
    name: "Cafétéria",
    floor: cheseaux.id,
    image: photo.id,
    position: { x: 40, y: 60 },
    createdBy: admin.id,
    ...properties,
  });
}

function validSpot(properties = {}) {
  return {
    name: "Cafétéria",
    floor: cheseaux.id,
    image: photo.id,
    position: { x: 40, y: 60 },
    ...properties,
  };
}

const unknownId = () => new mongoose.Types.ObjectId().toString();

describe("GET /spots", () => {
  it("lists the spots newest first, with their floor and image", async () => {
    const older = await createSpot({ name: "Older" });
    const newer = await createSpot({ name: "Newer" });

    const res = await supertest(app)
      .get("/spots")
      .set(authHeader(admin))
      .expect(200)
      .expect("Content-Type", /json/);

    assert.deepEqual(
      res.body.map((spot) => spot._id),
      [newer.id, older.id],
    );
    assert.equal(res.body[0].floor.building, "Cheseaux");
    assert.deepEqual(res.body[0].floor.letters, ["C"]);
    assert.equal(res.body[0].image.url, photo.url);
    assert.deepEqual(res.body[0].position, { x: 40, y: 60 });
    assert.equal(res.body[0].__v, undefined);
    assert.equal(res.headers["pagination-total"], "2");
  });

  it("paginates the list", async () => {
    for (let i = 0; i < 3; i += 1) {
      await createSpot({ name: `Spot ${i}` });
    }

    const res = await supertest(app)
      .get("/spots?page=2&pageSize=2")
      .set(authHeader(admin))
      .expect(200);

    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].name, "Spot 0");
    assert.equal(res.headers["pagination-page"], "2");
    assert.equal(res.headers["pagination-page-size"], "2");
    assert.equal(res.headers["pagination-total"], "3");
  });

  it("filters by floor", async () => {
    const spot = await createSpot({ floor: cheseaux.id });
    await createSpot({ floor: stRoch.id });

    const res = await supertest(app)
      .get(`/spots?floor=${cheseaux.id}`)
      .set(authHeader(admin))
      .expect(200);

    assert.deepEqual(
      res.body.map((s) => s._id),
      [spot.id],
    );
    assert.equal(res.headers["pagination-total"], "1");
  });

  it("filters by building", async () => {
    await createSpot({ floor: cheseaux.id });
    const spot = await createSpot({ floor: stRoch.id });

    const res = await supertest(app)
      .get("/spots?building=St-Roch")
      .set(authHeader(admin))
      .expect(200);

    assert.deepEqual(
      res.body.map((s) => s._id),
      [spot.id],
    );
  });

  it("combines the floor and building filters", async () => {
    await createSpot({ floor: cheseaux.id });

    const res = await supertest(app)
      .get(`/spots?floor=${cheseaux.id}&building=St-Roch`)
      .set(authHeader(admin))
      .expect(200);

    assert.deepEqual(res.body, []);
    assert.equal(res.headers["pagination-total"], "0");
  });

  it("returns 400 for a floor filter that is not a valid id", async () => {
    const res = await supertest(app)
      .get("/spots?floor=not-an-id")
      .set(authHeader(admin))
      .expect(400);

    assert.equal(res.body.message, 'Query parameter "floor" must be a valid ID');
  });

  it("returns 400 for an invalid page size", async () => {
    await supertest(app).get("/spots?pageSize=1000").set(authHeader(admin)).expect(400);
  });

  it("returns 403 for a player: spots contain the answers", async () => {
    await createSpot();

    const res = await supertest(app).get("/spots").set(authHeader(player)).expect(403);

    assert.equal(res.body.message, "Only admins can perform this operation");
  });

  it("returns 401 without a token", async () => {
    await supertest(app).get("/spots").expect(401);
  });
});

describe("GET /spots/:id", () => {
  it("returns the spot with its floor and image", async () => {
    const spot = await createSpot();

    const res = await supertest(app)
      .get(`/spots/${spot.id}`)
      .set(authHeader(admin))
      .expect(200);

    assert.equal(res.body._id, spot.id);
    assert.equal(res.body.floor._id, cheseaux.id);
    assert.equal(res.body.image.url, photo.url);
    assert.equal(res.body.createdBy, admin.id);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await supertest(app)
      .get(`/spots/${unknownId()}`)
      .set(authHeader(admin))
      .expect(404);

    assert.equal(res.body.message, "Spot not found");
  });

  it("returns 404 for an invalid id", async () => {
    await supertest(app).get("/spots/not-an-id").set(authHeader(admin)).expect(404);
  });

  it("returns 403 for a player", async () => {
    const spot = await createSpot();

    await supertest(app).get(`/spots/${spot.id}`).set(authHeader(player)).expect(403);
  });
});

describe("POST /spots", () => {
  it("creates the spot for the current admin and returns a Location header", async () => {
    const res = await supertest(app)
      .post("/spots")
      .set(authHeader(admin))
      .send(validSpot({ name: "  Bibliothèque " }))
      .expect(201)
      .expect("Content-Type", /json/);

    assert.equal(res.headers.location, `/spots/${res.body._id}`);
    assert.equal(res.body.name, "Bibliothèque");
    assert.equal(res.body.floor.building, "Cheseaux");
    assert.equal(res.body.image.url, photo.url);
    assert.deepEqual(res.body.position, { x: 40, y: 60 });
    assert.equal(res.body.createdBy, admin.id);
    assert.equal(await Spot.countDocuments(), 1);
  });

  it("ignores a createdBy sent by the client", async () => {
    const other = await createAdmin();

    const res = await supertest(app)
      .post("/spots")
      .set(authHeader(admin))
      .send(validSpot({ createdBy: other.id }))
      .expect(201);

    assert.equal(res.body.createdBy, admin.id);
  });

  it("accepts positions on the edges of the plan", async () => {
    const res = await supertest(app)
      .post("/spots")
      .set(authHeader(admin))
      .send(validSpot({ position: { x: 0, y: 100 } }))
      .expect(201);

    assert.deepEqual(res.body.position, { x: 0, y: 100 });
  });

  it("returns 422 with a message per missing field", async () => {
    const res = await supertest(app)
      .post("/spots")
      .set(authHeader(admin))
      .send({})
      .expect(422);

    assert.deepEqual(Object.keys(res.body.errors).sort(), ["floor", "image", "name", "position"]);
    assert.equal(await Spot.countDocuments(), 0);
  });

  it("returns 422 for a position outside the plan", async () => {
    const res = await supertest(app)
      .post("/spots")
      .set(authHeader(admin))
      .send(validSpot({ position: { x: -1, y: 101 } }))
      .expect(422);

    assert.equal(res.body.errors["position.x"], "X must be between 0 and 100");
    assert.equal(res.body.errors["position.y"], "Y must be between 0 and 100");
  });

  it("returns 422 for an incomplete or non-numeric position", async () => {
    const res = await supertest(app)
      .post("/spots")
      .set(authHeader(admin))
      .send(validSpot({ position: { x: "left" } }))
      .expect(422);

    assert.equal(res.body.errors["position.x"], "X must be a number");
    assert.equal(res.body.errors["position.y"], "Y is required");
  });

  it("returns 422 when the floor does not exist", async () => {
    const res = await supertest(app)
      .post("/spots")
      .set(authHeader(admin))
      .send(validSpot({ floor: unknownId() }))
      .expect(422);

    assert.equal(res.body.errors.floor, "Floor must reference an existing floor");
  });

  it("returns 422 when the image does not exist", async () => {
    const res = await supertest(app)
      .post("/spots")
      .set(authHeader(admin))
      .send(validSpot({ image: unknownId() }))
      .expect(422);

    assert.equal(res.body.errors.image, "Image must reference an existing upload");
  });

  it("returns 422 for invalid floor and image ids", async () => {
    const res = await supertest(app)
      .post("/spots")
      .set(authHeader(admin))
      .send(validSpot({ floor: "x", image: "y" }))
      .expect(422);

    assert.equal(res.body.errors.floor, "Floor must be a valid ID");
    assert.equal(res.body.errors.image, "Image must be a valid ID");
  });

  it("returns 403 for a player", async () => {
    await supertest(app).post("/spots").set(authHeader(player)).send(validSpot()).expect(403);

    assert.equal(await Spot.countDocuments(), 0);
  });

  it("returns 401 without a token", async () => {
    await supertest(app).post("/spots").send(validSpot()).expect(401);
  });
});

describe("PATCH /spots/:id", () => {
  it("updates only the given fields", async () => {
    const spot = await createSpot();

    const res = await supertest(app)
      .patch(`/spots/${spot.id}`)
      .set(authHeader(admin))
      .send({ floor: stRoch.id, position: { x: 10, y: 20 } })
      .expect(200);

    assert.equal(res.body.floor._id, stRoch.id);
    assert.deepEqual(res.body.position, { x: 10, y: 20 });
    assert.equal(res.body.name, "Cafétéria");
    assert.equal((await Spot.findById(spot.id)).floor.toString(), stRoch.id);
  });

  it("does not change createdBy", async () => {
    const spot = await createSpot();
    const other = await createAdmin();

    const res = await supertest(app)
      .patch(`/spots/${spot.id}`)
      .set(authHeader(other))
      .send({ name: "Renamed", createdBy: other.id })
      .expect(200);

    assert.equal(res.body.name, "Renamed");
    assert.equal(res.body.createdBy, admin.id);
  });

  it("returns 422 when the new image does not exist", async () => {
    const spot = await createSpot();

    await supertest(app)
      .patch(`/spots/${spot.id}`)
      .set(authHeader(admin))
      .send({ image: unknownId() })
      .expect(422);

    assert.equal((await Spot.findById(spot.id)).image.toString(), photo.id);
  });

  it("returns 422 when the new position is outside the plan", async () => {
    const spot = await createSpot();

    await supertest(app)
      .patch(`/spots/${spot.id}`)
      .set(authHeader(admin))
      .send({ position: { x: 50, y: 150 } })
      .expect(422);
  });

  it("returns 404 for an unknown spot", async () => {
    await supertest(app)
      .patch(`/spots/${unknownId()}`)
      .set(authHeader(admin))
      .send({ name: "x" })
      .expect(404);
  });

  it("returns 403 for a player", async () => {
    const spot = await createSpot();

    await supertest(app)
      .patch(`/spots/${spot.id}`)
      .set(authHeader(player))
      .send({ name: "Hacked" })
      .expect(403);

    assert.equal((await Spot.findById(spot.id)).name, "Cafétéria");
  });
});

describe("DELETE /spots/:id", () => {
  it("deletes the spot", async () => {
    const spot = await createSpot();

    const res = await supertest(app)
      .delete(`/spots/${spot.id}`)
      .set(authHeader(admin))
      .expect(204);

    assert.equal(res.text, "");
    assert.equal(await Spot.countDocuments(), 0);
  });

  it("returns 404 for an unknown spot", async () => {
    await supertest(app).delete(`/spots/${unknownId()}`).set(authHeader(admin)).expect(404);
  });

  it("returns 403 for a player", async () => {
    const spot = await createSpot();

    await supertest(app).delete(`/spots/${spot.id}`).set(authHeader(player)).expect(403);

    assert.equal(await Spot.countDocuments(), 1);
  });
});
