import express from "express";
import createError from "http-errors";
import logger from "morgan";

import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import filesRouter from "./routes/uploads.js";

import cors from "cors";
import mongoose from "mongoose";
import { corsOrigins, databaseUrl } from "./config.js";

mongoose.connect(databaseUrl);

const app = express();

// Allowed browser origins come from $CORS_ORIGIN (see config.js)
app.use(cors({ origin: corsOrigins }));

app.use(logger("dev"));
app.use(express.json());

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/uploads", filesRouter);

// Catch 404 and forward to the error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.status(err.status ?? 500);
  res.send({ message: err.message });
});

export default app;
