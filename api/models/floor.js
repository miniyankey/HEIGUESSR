import mongoose from "mongoose";
import { referenceTo } from "./validators.js";

// HEIG-VD buildings that have floor plans
export const BUILDINGS = ["Cheseaux", "St-Roch"];

const floorSchema = new mongoose.Schema(
  {
    building: {
      type: String,
      required: [true, "Building is required"],
      trim: true,
      enum: { values: BUILDINGS, message: `Building must be one of: ${BUILDINGS.join(", ")}` },
    },
    // Physical height, only used to order the floors (0 = ground floor,
    // negative = basement). Unique per building.
    level: {
      type: Number,
      required: [true, "Level is required"],
      cast: "Level must be an integer",
      validate: { validator: Number.isInteger, message: "Level must be an integer" },
    },
    // Letters HEIG-VD gives to this level (A = lowest, gaps allowed). A level
    // has several letters when it is split into zones that are not connected,
    // e.g. ["C", "D"]. A letter belongs to only one floor of a building.
    letters: {
      type: [{ type: String, trim: true, uppercase: true }],
      default: undefined,
      // Checked on the whole list, so every error is reported under "letters"
      validate: [
        {
          validator: (letters) => letters.length > 0,
          message: "At least one letter is required",
        },
        {
          validator: (letters) => letters.every((letter) => /^[A-Z]$/.test(letter)),
          message: "Each letter must be a single letter from A to Z",
        },
        {
          validator: (letters) => new Set(letters).size === letters.length,
          message: "Letters must not repeat",
        },
      ],
      required: [true, "At least one letter is required"],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name must be at most 100 characters"],
    },
    // Image of the floor plan, on which players click
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
      required: [true, "Plan is required"],
      cast: "Plan must be a valid ID",
      validate: referenceTo("Upload", "Plan must reference an existing upload"),
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

// Always store the letters in order: ["D", "C"] becomes ["C", "D"]
floorSchema.pre("validate", function () {
  if (this.letters && this.isModified("letters")) {
    this.letters.sort();
  }
});

// A building has only one floor per level...
floorSchema.index({ building: 1, level: 1 }, { unique: true });
// ...and a letter is on only one of its floors (multikey index: one entry per
// letter, so two floors of a building cannot share a letter)
floorSchema.index({ building: 1, letters: 1 }, { unique: true });

export default mongoose.model("Floor", floorSchema);
