const { Client } = require("pg");
const { testDatabaseUrl } = require("./testDatabaseUrl");

module.exports = async function () {
  const url = new URL(testDatabaseUrl());
  const dbName = url.pathname.slice(1);

  url.pathname = "/postgres";
  const client = new Client({ connectionString: url.toString() });
  await client.connect();

  try {
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`\nCreated test database ${dbName}`);
    }
  } finally {
    await client.end();
  }
};
