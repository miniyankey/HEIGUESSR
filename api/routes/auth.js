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

export const MIN_PASSWORD_LENGTH = 8;

// Validation (422) and duplicate (409) errors are turned into responses by the
// global error handler (middlewares/errors.js).
router.post("/register", async function (req, res) {
  const { username, password, firstname, lastname, email } = req.body ?? {};
  const user = new User({ username, firstname, lastname, email });

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    // Report the password together with the other invalid fields. The hash
    // is skipped: it cannot exist without a valid password.
    user.invalidate(
      "password",
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
    await user.validate({ pathsToSkip: ["hash"] });
  }

  user.hash = await bcrypt.hash(password, 10);
  await user.save();

  const token = jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: "7d" });
  res.status(201).send({ token });
});

export default router;
