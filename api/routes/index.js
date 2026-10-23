import express from 'express';
import { authenticate } from "../middlewares/auth.js";
import User from '../models/user.js';

const router = express.Router();

router.get('/', function (req, res) {
  res.send('Ignition!');
});

// A ROUTE TO TEST THE AUTHENTICATION MIDDLEWARE. TO DELETE AFTER
router.get("/me", authenticate, async (req, res) => {
  const user = await User.findById(req.currentUserId).exec();
  if (!user) return res.status(401).send({ message: "User no longer exists" });
  res.send(user);
});

export default router;
