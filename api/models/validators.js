import mongoose from "mongoose";

/**
 * Schema validator checking that an ObjectId references an existing document
 * of another model. A missing reference becomes a normal validation error
 * (422), on creation and on update.
 */
export function referenceTo(modelName, message) {
  return {
    validator: async (id) => Boolean(await mongoose.model(modelName).exists({ _id: id })),
    message,
  };
}
