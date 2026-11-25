import express from "express";
import createError from "http-errors";
import { authenticate, authenticateAdmin } from "../middlewares/auth.js";
import Floor from "../models/floor.js";
import Spot from "../models/spot.js";

const router = express.Router();

// Fields a client may set; anything else in the body is ignored
const EDITABLE_FIELDS = ["building", "level", "letters", "name", "plan"];

// Players need the plan image to place their guess
const PLAN_FIELDS = "url width height";

function pickEditableFields(body) {
  const fields = {};
  for (const field of EDITABLE_FIELDS) {
    if (body?.[field] !== undefined) {
      fields[field] = body[field];
    }
  }
  return fields;
}

/** Loads the floor of `:id` into req.floor, or responds 404. */
async function loadFloor(req, res, next) {
  const floor = await Floor.findById(req.params.id);
  if (!floor) {
    throw createError(404, "Floor not found");
  }
  req.floor = floor;
  next();
}

/** Reads an optional query parameter given at most once. */
function optionalQueryString(req, name) {
  const value = req.query[name];
  if (value !== undefined && typeof value !== "string") {
    throw createError(400, `Query parameter "${name}" must be given only once`);
  }
  return value;
}

// Optional filters: ?building=Cheseaux, ?letter=C (the floor that has this letter)
router.get("/", authenticate, async (req, res) => {
  const filter = {};
  const building = optionalQueryString(req, "building");
  const letter = optionalQueryString(req, "letter");
  if (building !== undefined) {
    filter.building = building;
  }
  if (letter !== undefined) {
    filter.letters = letter.trim().toUpperCase();
  }

  const floors = await Floor.find(filter)
    .sort({ building: 1, level: 1 })
    .populate("plan", PLAN_FIELDS);
  res.send(floors);
});

router.get("/:id", authenticate, loadFloor, async (req, res) => {
  await req.floor.populate("plan", PLAN_FIELDS);
  res.send(req.floor);
});

router.post("/", authenticateAdmin, async (req, res) => {
  const floor = await Floor.create(pickEditableFields(req.body));
  await floor.populate("plan", PLAN_FIELDS);
  res.status(201).location(`${req.baseUrl}/${floor.id}`).send(floor);
});

router.patch("/:id", authenticateAdmin, loadFloor, async (req, res) => {
  req.floor.set(pickEditableFields(req.body));
  await req.floor.save();
  await req.floor.populate("plan", PLAN_FIELDS);
  res.send(req.floor);
});

router.delete("/:id", authenticateAdmin, loadFloor, async (req, res) => {
  if (await Spot.exists({ floor: req.floor._id })) {
    throw createError(409, "This floor still has spots: delete them first");
  }
  await req.floor.deleteOne();
  res.sendStatus(204);
});

export default router;
