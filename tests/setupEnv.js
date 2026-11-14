const crypto = require("crypto");
require("dotenv").config({ quiet: true });

const url = process.env.TEST_DATABASE_URL;

if (!url) {
  throw new Error("TEST_DATABASE_URL is not set");
}

const dbName = new URL(url).pathname.slice(1);

if (!dbName.endsWith("_test")) {
  throw new Error(`Refusing to run tests on database "${dbName}" (name must end with _test)`);
}

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = url;
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.JWT_EXPIRES_IN = "15m";
