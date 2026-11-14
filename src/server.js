const config = require("./config");
const { createApp } = require("./app");
const db = require("./db");
const { createRepositories } = require("./repositories");
const { createEventBus } = require("./events/eventBus");

const eventBus = createEventBus();
const app = createApp({ ...createRepositories(db), eventBus });

const server = app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  console.log(`${signal} received, shutting down`);

  setTimeout(() => {
    console.error("Shutdown took too long, forcing exit");
    process.exit(1);
  }, 8000).unref();

  server.close(async (err) => {
    if (err) {
      console.error("Error while closing HTTP server", err);
    } else {
      console.log("HTTP server closed");
    }

    await db.destroy();
    console.log("Database connections closed");
    process.exit(err ? 1 : 0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
