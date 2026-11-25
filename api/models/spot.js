import mongoose from "mongoose";
import { referenceTo } from "./validators.js";

function coordinate(axis) {
  const label = axis.toUpperCase();
  return {
    type: Number,
    required: [true, `${label} is required`],
    cast: `${label} must be a number`,
    min: [0, `${label} must be between 0 and 100`],
    max: [100, `${label} must be between 0 and 100`],
  };
}

// A spawn spot: a photo taken somewhere in a building, and the place on the
// floor plan where it was taken (the answer players must find).
const spotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name must be at most 100 characters"],
    },
    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: [true, "Floor is required"],
      cast: "Floor must be a valid ID",
      validate: referenceTo("Floor", "Floor must reference an existing floor"),
      index: true,
    },
    // Photo shown to the players
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
      required: [true, "Image is required"],
      cast: "Image must be a valid ID",
      validate: referenceTo("Upload", "Image must reference an existing upload"),
    },
    // Percentages (0-100) of the plan's width (x) and height (y), from the
    // top-left corner
    position: {
      type: new mongoose.Schema({ x: coordinate("x"), y: coordinate("y") }, { _id: false }),
      required: [true, "Position is required"],
    },
    // Set by the server: the admin who created the spot
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

export default mongoose.model("Spot", spotSchema);
