import { readFileSync } from "node:fs";
import cors from "cors";
import express from "express";
import logger from "morgan";
import swaggerUi from "swagger-ui-express";
import { parse as parseYaml } from "yaml";

import { corsOrigins } from "./config.js";
import { errorHandler, notFound } from "./middlewares/errors.js";
import { paginationHeaders } from "./middlewares/pagination.js";
import authRouter from "./routes/auth.js";
import uploadsRouter from "./routes/uploads.js";

const openApiDocument = parseYaml(
  readFileSync(new URL("./openapi.yaml", import.meta.url), "utf8"),
);

const app = express();

// Allowed browser origins come from $CORS_ORIGIN (see config.js). The browser
// may only read non-standard response headers that are listed here.
app.use(
  cors({
    origin: corsOrigins,
    exposedHeaders: ["Location", ...paginationHeaders],
  }),
);

if (process.env.NODE_ENV !== "test") {
  app.use(logger("dev"));
}
app.use(express.json());

app.get("/", (req, res) => res.redirect("/api-docs"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/auth", authRouter);
app.use("/uploads", uploadsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
