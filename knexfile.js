require("dotenv").config({ quiet: true });

module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: "./db/migrations",
  },
  seeds: {
    directory: "./db/seeds",
  },
};
