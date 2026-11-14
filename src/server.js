const config = require("./config");
const { createApp } = require("./app");
const db = require("./db");
const { createRepositories } = require("./repositories");

const app = createApp(createRepositories(db));

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
