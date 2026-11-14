require("dotenv").config({ quiet: true });

function testDatabaseUrl() {
  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error("TEST_DATABASE_URL is not set");
  }

  const dbName = new URL(url).pathname.slice(1);

  if (!dbName.endsWith("_test")) {
    throw new Error(`Refusing to run tests on database "${dbName}" (name must end with _test)`);
  }

  return url;
}

module.exports = { testDatabaseUrl };
