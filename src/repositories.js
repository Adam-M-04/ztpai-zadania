const { createUsersRepository } = require("./modules/users/users.repository.knex");
const { createBuildingsRepository } = require("./modules/buildings/buildings.repository.knex");
const { createRoomsRepository } = require("./modules/rooms/rooms.repository.knex");
const { createReservationsRepository } = require("./modules/reservations/reservations.repository.knex");
const { createAuditLogRepository } = require("./modules/audit-log/audit-log.repository.knex");

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
    auditLogRepository: createAuditLogRepository(db),
    runInTransaction,
  };
}

module.exports = { createRepositories };
