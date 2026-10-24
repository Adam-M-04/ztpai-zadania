const { createApp } = require("./app");
const db = require("./db");
const { createBuildingsRepository } = require("./modules/buildings/buildings.repository.knex");
const { createRoomsRepository } = require("./modules/rooms/rooms.repository.knex");
const { createReservationsRepository } = require("./modules/reservations/reservations.repository.knex");

const PORT = 3000;

const app = createApp({
  buildingsRepository: createBuildingsRepository(db),
  roomsRepository: createRoomsRepository(db),
  reservationsRepository: createReservationsRepository(db),
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
