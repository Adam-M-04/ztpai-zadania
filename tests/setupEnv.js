const crypto = require("crypto");
const { testDatabaseUrl } = require("./testDatabaseUrl");

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = testDatabaseUrl();
process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
process.env.JWT_EXPIRES_IN = "15m";
