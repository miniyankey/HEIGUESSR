import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },

    originalName: { type: String },

    mimeType: {
      type: String,
      required: true,
      enum: ["image/jpeg", "image/png", "image/webp"],
    },

    size: { type: Number },

    alt: { type: String, trim: true },
  },
  { timestamps: true },
);

imageSchema.virtual("url").get(function () {
  return `/uploads/${this.filename}`;
});

imageSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Image", imageSchema);
