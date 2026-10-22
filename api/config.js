export const port = process.env.PORT ?? 27017;

export const databaseUrl = process.env.MONGODB_URI ?? "mongodb://127.0.0.1/api";

if (process.env.MONGODB_URI) {
  try {
    new URL(process.env.MONGODB_URI);
  } catch (error) {
    throw new TypeError(
      "Environment variable $MONGODB_URI must be a valid URL",
    );
  }
}

if (process.env.PORT) {
  const parsedPort = Number(process.env.PORT);
  if (!Number.isInteger(parsedPort)) {
    throw new TypeError("Environment variable $PORT must be an integer");
  } else if (parsedPort < 1 || parsedPort > 65535) {
    throw new TypeError(
      "Environment variable $PORT must be a valid port number",
    );
  }
}
