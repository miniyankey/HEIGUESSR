import express from "express";
import User from "../models/user.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.get("/", async function (req, res) {
  try {
    await User.create({
      username: "TEST",
      lastname: "TEST",
      firstname: "TEST",
      email: "TEST",
      hash: await bcrypt.hash("TEST", 10), //hashed password
    });
  } catch (err) {
    if (err.name !== "ValidationError") {
      throw err;
    }
    for (const [path, error] of Object.entries(err.errors)) {
      console.log(path, error.message);
    }
  }
  res.send("Got a response from the users route");
});

export default router;
