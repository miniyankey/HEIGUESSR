import mongoose from "mongoose";
import app from "../app.js";
import { databaseUrl, port } from "../config.js";

// The database connection lives here (not in app.js) so tests can connect
// the app to their own in-memory database.
await mongoose.connect(databaseUrl);

app.listen(port, function (error) {
  if (error) {
    throw error;
  }

  console.log(`Listening on http://localhost:${port}`);
});
