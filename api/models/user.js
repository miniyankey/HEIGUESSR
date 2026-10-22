import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  username: String,
  lastname: String,
  firstname: String,
  email: String,
  hash: String, //hashed password
  date: { type: Date, default: Date.now }, // Default value
});
export default mongoose.model("User", userSchema);
