import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    format: String,
    bytes: Number,
    width: Number,
    height: Number,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Upload", uploadSchema);