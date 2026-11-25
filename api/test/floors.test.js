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
let plan;

beforeEach(async () => {
  admin = await createAdmin();
  player = await createUser();
  plan = await createUpload(admin);
});

/** By default, one letter derived from the level: -1 → A, 0 → B, 1 → C… */
function createFloor(properties = {}) {
  const level = properties.level ?? 1;
  return Floor.create({
    building: "Cheseaux",
    level,
    letters: [String.fromCharCode(66 + level)],
    plan: plan.id,
    ...properties,
  });
}

function validFloor(properties = {}) {
  return { building: "Cheseaux", level: 1, letters: ["C"], plan: plan.id, ...properties };
}

const unknownId = () => new mongoose.Types.ObjectId().toString();

describe("GET /floors", () => {
  it("lists every floor sorted by building then level, with the plan image", async () => {
    await createFloor({ building: "St-Roch", level: 0 });
    await createFloor({ building: "Cheseaux", level: 2 });
    await createFloor({ building: "Cheseaux", level: -1 });

    const res = await supertest(app)
      .get("/floors")
      .set(authHeader(player))
      .expect(200)
      .expect("Content-Type", /json/);

    assert.deepEqual(
      res.body.map((floor) => [floor.building, floor.level]),
      [
        ["Cheseaux", -1],
        ["Cheseaux", 2],
        ["St-Roch", 0],
      ],
    );
    assert.equal(res.body[0].plan._id, plan.id);
    assert.equal(res.body[0].plan.url, plan.url);
    assert.equal(res.body[0].plan.width, 1200);
    assert.equal(res.body[0].__v, undefined);
  });

  it("filters by building", async () => {
    await createFloor({ building: "Cheseaux", level: 0 });
    await createFloor({ building: "St-Roch", level: 0 });

    const res = await supertest(app)
      .get("/floors?building=St-Roch")
      .set(authHeader(player))
      .expect(200);

    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].building, "St-Roch");
  });

  it("filters by letter, whatever its case", async () => {
    await createFloor({ level: 0, letters: ["A", "B"] });
    const target = await createFloor({ level: 1, letters: ["C", "D"] });

    const res = await supertest(app)
      .get("/floors?letter=d")
      .set(authHeader(player))
      .expect(200);

    assert.deepEqual(
      res.body.map((floor) => floor._id),
      [target.id],
    );
  });

  it("returns an empty array when no floor matches", async () => {
    await createFloor();

    const res = await supertest(app)
      .get("/floors?building=Unknown")
      .set(authHeader(player))
      .expect(200);

    assert.deepEqual(res.body, []);
  });

  it("returns 400 when building is given several times", async () => {
    await supertest(app)
      .get("/floors?building=A&building=B")
      .set(authHeader(player))
      .expect(400);
  });

  it("returns 401 without a token", async () => {
    await supertest(app).get("/floors").expect(401);
  });
});

describe("GET /floors/:id", () => {
  it("returns the floor with its plan image", async () => {
    const floor = await createFloor({ name: "Étage des salles de cours" });

    const res = await supertest(app)
      .get(`/floors/${floor.id}`)
      .set(authHeader(player))
      .expect(200);

    assert.equal(res.body._id, floor.id);
    assert.equal(res.body.name, "Étage des salles de cours");
    assert.equal(res.body.plan.url, plan.url);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await supertest(app)
      .get(`/floors/${unknownId()}`)
      .set(authHeader(player))
      .expect(404);

    assert.equal(res.body.message, "Floor not found");
  });

  it("returns 404 for an invalid id", async () => {
    await supertest(app).get("/floors/not-an-id").set(authHeader(player)).expect(404);
  });

  it("returns 401 without a token", async () => {
    const floor = await createFloor();

    await supertest(app).get(`/floors/${floor.id}`).expect(401);
  });
});

describe("POST /floors", () => {
  it("creates the floor and returns it with a Location header", async () => {
    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send({ building: "  Cheseaux ", level: 2, letters: ["D"], name: "Deuxième", plan: plan.id })
      .expect(201)
      .expect("Content-Type", /json/);

    assert.equal(res.headers.location, `/floors/${res.body._id}`);
    assert.equal(res.body.building, "Cheseaux");
    assert.equal(res.body.level, 2);
    assert.deepEqual(res.body.letters, ["D"]);
    assert.equal(res.body.plan.url, plan.url);
    assert.equal(await Floor.countDocuments(), 1);
  });

  it("accepts several letters for zones of one level, uppercased and sorted", async () => {
    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send(validFloor({ letters: ["d", " c "] }))
      .expect(201);

    assert.deepEqual(res.body.letters, ["C", "D"]);
  });

  it("returns 422 for an empty list of letters", async () => {
    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send(validFloor({ letters: [] }))
      .expect(422);

    assert.equal(res.body.errors.letters, "At least one letter is required");
  });

  it("returns 422 for a letter that is not a single letter from A to Z", async () => {
    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send(validFloor({ letters: ["C", "AB"] }))
      .expect(422);

    assert.equal(res.body.errors.letters, "Each letter must be a single letter from A to Z");
  });

  it("returns 422 when a letter is repeated", async () => {
    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send(validFloor({ letters: ["C", "c"] }))
      .expect(422);

    assert.equal(res.body.errors.letters, "Letters must not repeat");
  });

  it("returns 409 when a letter is already used by another floor of the building", async () => {
    await createFloor({ level: 0, letters: ["B", "C"] });

    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send(validFloor({ level: 1, letters: ["C", "D"] }))
      .expect(409);

    assert.equal(res.body.message, "building and letters already in use");
  });

  it("accepts a letter already used in another building", async () => {
    await createFloor({ building: "St-Roch", level: 1, letters: ["C"] });

    await supertest(app).post("/floors").set(authHeader(admin)).send(validFloor()).expect(201);
  });

  it("ignores fields that are not editable", async () => {
    const forcedId = unknownId();

    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send({ _id: forcedId, ...validFloor() })
      .expect(201);

    assert.notEqual(res.body._id, forcedId);
  });

  it("returns 422 with a message per missing field", async () => {
    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send({})
      .expect(422);

    assert.deepEqual(Object.keys(res.body.errors).sort(), [
      "building",
      "letters",
      "level",
      "plan",
    ]);
    assert.equal(await Floor.countDocuments(), 0);
  });

  it("returns 422 for a building that is not a HEIG-VD building", async () => {
    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send(validFloor({ building: "Yverdon-Gare" }))
      .expect(422);

    assert.match(res.body.errors.building, /Building must be one of: Cheseaux, St-Roch/);
  });

  it("returns 422 when the level is not an integer", async () => {
    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send(validFloor({ level: 1.5 }))
      .expect(422);

    assert.equal(res.body.errors.level, "Level must be an integer");
  });

  it("returns 422 when the plan does not reference an existing upload", async () => {
    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send(validFloor({ plan: unknownId() }))
      .expect(422);

    assert.equal(res.body.errors.plan, "Plan must reference an existing upload");
  });

  it("returns 422 when the plan is not a valid id", async () => {
    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send(validFloor({ plan: "not-an-id" }))
      .expect(422);

    assert.equal(res.body.errors.plan, "Plan must be a valid ID");
  });

  it("returns 409 when the building already has this level", async () => {
    await createFloor({ building: "Cheseaux", level: 1 });

    const res = await supertest(app)
      .post("/floors")
      .set(authHeader(admin))
      .send(validFloor({ letters: ["E"] }))
      .expect(409);

    assert.equal(res.body.message, "building and level already in use");
    assert.equal(await Floor.countDocuments(), 1);
  });

  it("returns 403 for a player", async () => {
    await supertest(app)
      .post("/floors")
      .set(authHeader(player))
      .send(validFloor())
      .expect(403);

    assert.equal(await Floor.countDocuments(), 0);
  });

  it("returns 401 without a token", async () => {
    await supertest(app)
      .post("/floors")
      .send(validFloor())
      .expect(401);
  });
});

describe("PATCH /floors/:id", () => {
  it("updates only the given fields", async () => {
    const floor = await createFloor({ name: "Ancien nom" });
    const newPlan = await createUpload(admin);

    const res = await supertest(app)
      .patch(`/floors/${floor.id}`)
      .set(authHeader(admin))
      .send({ name: "Nouveau nom", plan: newPlan.id })
      .expect(200);

    assert.equal(res.body.name, "Nouveau nom");
    assert.equal(res.body.plan._id, newPlan.id);
    assert.equal(res.body.building, "Cheseaux");
    assert.equal(res.body.level, 1);
    assert.equal((await Floor.findById(floor.id)).name, "Nouveau nom");
  });

  it("replaces the letters of the floor", async () => {
    const floor = await createFloor({ letters: ["C"] });

    const res = await supertest(app)
      .patch(`/floors/${floor.id}`)
      .set(authHeader(admin))
      .send({ letters: ["E", "C"] })
      .expect(200);

    assert.deepEqual(res.body.letters, ["C", "E"]);
  });

  it("returns 422 when the new plan does not exist", async () => {
    const floor = await createFloor();

    await supertest(app)
      .patch(`/floors/${floor.id}`)
      .set(authHeader(admin))
      .send({ plan: unknownId() })
      .expect(422);

    assert.equal((await Floor.findById(floor.id)).plan.toString(), plan.id);
  });

  it("returns 422 when a required field is emptied", async () => {
    const floor = await createFloor();

    const res = await supertest(app)
      .patch(`/floors/${floor.id}`)
      .set(authHeader(admin))
      .send({ building: "" })
      .expect(422);

    assert.ok(res.body.errors.building);
  });

  it("returns 409 when moving to a level already used in the building", async () => {
    await createFloor({ level: 1 });
    const floor = await createFloor({ level: 2 });

    await supertest(app)
      .patch(`/floors/${floor.id}`)
      .set(authHeader(admin))
      .send({ level: 1 })
      .expect(409);
  });

  it("returns 404 for an unknown floor", async () => {
    await supertest(app)
      .patch(`/floors/${unknownId()}`)
      .set(authHeader(admin))
      .send({ name: "x" })
      .expect(404);
  });

  it("returns 403 for a player", async () => {
    const floor = await createFloor({ name: "Original" });

    await supertest(app)
      .patch(`/floors/${floor.id}`)
      .set(authHeader(player))
      .send({ name: "Hacked" })
      .expect(403);

    assert.equal((await Floor.findById(floor.id)).name, "Original");
  });
});

describe("DELETE /floors/:id", () => {
  it("deletes the floor", async () => {
    const floor = await createFloor();

    const res = await supertest(app)
      .delete(`/floors/${floor.id}`)
      .set(authHeader(admin))
      .expect(204);

    assert.equal(res.text, "");
    assert.equal(await Floor.countDocuments(), 0);
  });

  it("returns 409 when spots are on the floor", async () => {
    const floor = await createFloor();
    await Spot.create({
      name: "Cafétéria",
      floor: floor.id,
      image: (await createUpload(admin)).id,
      position: { x: 40, y: 60 },
      createdBy: admin.id,
    });

    const res = await supertest(app)
      .delete(`/floors/${floor.id}`)
      .set(authHeader(admin))
      .expect(409);

    assert.match(res.body.message, /still has spots/);
    assert.equal(await Floor.countDocuments(), 1);
  });

  it("returns 404 for an unknown floor", async () => {
    await supertest(app).delete(`/floors/${unknownId()}`).set(authHeader(admin)).expect(404);
  });

  it("returns 403 for a player", async () => {
    const floor = await createFloor();

    await supertest(app).delete(`/floors/${floor.id}`).set(authHeader(player)).expect(403);

    assert.equal(await Floor.countDocuments(), 1);
  });
});
