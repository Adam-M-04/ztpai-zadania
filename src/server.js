const config = require("./config");
const { createApp } = require("./app");
const db = require("./db");
const { createUsersRepository } = require("./modules/users/users.repository.knex");
const { createBuildingsRepository } = require("./modules/buildings/buildings.repository.knex");
const { createRoomsRepository } = require("./modules/rooms/rooms.repository.knex");
const { createReservationsRepository } = require("./modules/reservations/reservations.repository.knex");

function runInTransaction(work) {
  return db.transaction((trx) =>
    work({
      roomsRepository: createRoomsRepository(trx),
      reservationsRepository: createReservationsRepository(trx),
    })
  );
}

const app = createApp({
  usersRepository: createUsersRepository(db),
  buildingsRepository: createBuildingsRepository(db),
  roomsRepository: createRoomsRepository(db),
  reservationsRepository: createReservationsRepository(db),
  runInTransaction,
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
