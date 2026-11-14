const { createUsersRepository } = require("./modules/users/users.repository.knex");
const { createBuildingsRepository } = require("./modules/buildings/buildings.repository.knex");
const { createRoomsRepository } = require("./modules/rooms/rooms.repository.knex");
const { createReservationsRepository } = require("./modules/reservations/reservations.repository.knex");

function createRepositories(db) {
  function runInTransaction(work) {
    return db.transaction((trx) =>
      work({
        roomsRepository: createRoomsRepository(trx),
        reservationsRepository: createReservationsRepository(trx),
      })
    );
  }

  return {
    usersRepository: createUsersRepository(db),
    buildingsRepository: createBuildingsRepository(db),
    roomsRepository: createRoomsRepository(db),
    reservationsRepository: createReservationsRepository(db),
    runInTransaction,
  };
}

module.exports = { createRepositories };
