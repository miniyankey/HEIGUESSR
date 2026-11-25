import mongoose from "mongoose";

// Routes and reference checks come with the Spots issue. The structure is
// already needed by floors: a floor with spots cannot be deleted.
const spotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
      index: true,
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
      required: true,
    },
    // Percentages (0-100) of the plan's width and height
    position: {
      x: { type: Number, required: true, min: 0, max: 100 },
      y: { type: Number, required: true, min: 0, max: 100 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Spot", spotSchema);
