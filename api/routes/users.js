import express from "express";
import { authenticate, loadCurrentUser } from "../middlewares/auth.js";

const router = express.Router();

// Profile of the authenticated user, including the role, so the client knows
// whether to show the admin screens.
router.get("/me", authenticate, loadCurrentUser, function (req, res) {
  res.send(req.currentUser);
});

export default router;