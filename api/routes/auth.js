import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config.js";
import User from "../models/user.js";

const router = express.Router();

router.post("/login", async function (req, res) {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(422).send({ message: "Name and password are required" });
  }
  const user = await User.findOne({ username }).select("+hash").exec();
  if (!user) {
    return res.status(401).send({ message: "Invalid name or password" });
  }
  const valid = await bcrypt.compare(password, user.hash);
  if (!valid) {
    return res.status(401).send({ message: "Invalid name or password" });
  }
  const payload = { sub: user.id }; // user.id is the ID as a string
  const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
  res.send({ token });
});

router.post("/register", async function (req, res, next) {
  const { username, password, firstname, lastname, email } = req.body ?? {};
  try {
    if (!password || password.length < 8) {
      return res
        .status(400)
        .send({ message: "Password must be at least 8 characters" });
    }
    const user = await User.create({
      username,
      firstname,
      lastname,
      email,
      hash: await bcrypt.hash(password, 10),
    });
    const token = jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: "7d" });
    return res.status(201).send({ token });
  } catch (err) {
    // Mongoose validation errors -> 400 with details per field
    if (err.name === "ValidationError") {
      const errors = {};
      for (const [path, error] of Object.entries(err.errors)) {
        errors[path] = error.message;
      }
      return res.status(400).send({ message: "Validation failed", errors });
    }
    // Duplicate username or email -> 409
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).send({ message: `${field} already in use` });
    }
    // Anything else -> your error handler in app.js
    return next(err);
  }
});

export default router;
