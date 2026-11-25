import express from "express";
import { authenticateAdmin } from "../middlewares/auth.js";
import { paginate, setPaginationHeaders } from "../middlewares/pagination.js";
import {
  loadDocument,
  optionalQueryId,
  optionalQueryString,
  pickFields,
} from "../middlewares/resources.js";
import Floor from "../models/floor.js";
import Spot from "../models/spot.js";

const router = express.Router();

// A spot contains the answer of a round (its position): only admins see them.
// Players will get the photo of a spot through their game, never its position.
router.use(authenticateAdmin);

// Fields a client may set; createdBy comes from the token
const EDITABLE_FIELDS = ["name", "floor", "image", "position"];

const loadSpot = loadDocument(Spot, "spot", "Spot not found");

/**
 * Adds the floor and the image needed to show a spot to an admin. Works on a
 * query and on a document.
 */
function populateSpot(queryOrSpot) {
  return queryOrSpot.populate([
    { path: "floor", select: "building level letters name" },
    { path: "image", select: "url width height" },
  ]);
}

// Paginated, newest first. Optional filters: ?floor=<id>, ?building=Cheseaux
router.get("/", paginate, async (req, res) => {
  const filter = {};
  const floor = optionalQueryId(req, "floor");
  const building = optionalQueryString(req, "building");
  if (floor !== undefined || building !== undefined) {
    filter.floor = {};
    if (floor !== undefined) {
      filter.floor.$eq = floor;
    }
    if (building !== undefined) {
      filter.floor.$in = await Floor.find({ building }).distinct("_id");
    }
  }

  const { skip, pageSize } = req.pagination;
  const [spots, total] = await Promise.all([
    populateSpot(Spot.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(pageSize)),
    Spot.countDocuments(filter),
  ]);
  setPaginationHeaders(res, req.pagination, total);
  res.send(spots);
});

router.get("/:id", loadSpot, async (req, res) => {
  res.send(await populateSpot(req.spot));
});

router.post("/", async (req, res) => {
  const spot = await Spot.create({
    ...pickFields(req.body, EDITABLE_FIELDS),
    createdBy: req.currentUserId,
  });
  res.status(201).location(`${req.baseUrl}/${spot.id}`).send(await populateSpot(spot));
});

router.patch("/:id", loadSpot, async (req, res) => {
  req.spot.set(pickFields(req.body, EDITABLE_FIELDS));
  await req.spot.save();
  res.send(await populateSpot(req.spot));
});

router.delete("/:id", loadSpot, async (req, res) => {
  await req.spot.deleteOne();
  res.sendStatus(204);
});

export default router;
