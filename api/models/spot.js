import mongoose from "mongoose";

const spotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
      required: true,
    },

    position: {
      x: { type: Number, required: true, min: 0, max: 100 },
      y: { type: Number, required: true, min: 0, max: 100 },
    },

    building: { type: String, required: true, trim: true },
    floor: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

spotSchema.index({ building: 1, floor: 1 });

export default mongoose.model("Spot", spotSchema);
