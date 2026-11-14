const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapi = require("./docs/openapi");
const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const authenticate = require("./middleware/authenticate");
const { createAuthService } = require("./modules/auth/auth.service");
const { createAuthController } = require("./modules/auth/auth.controller");
const { createAuthRouter } = require("./modules/auth/auth.routes");
const { createBuildingsService } = require("./modules/buildings/buildings.service");
const { createBuildingsController } = require("./modules/buildings/buildings.controller");
const { createBuildingsRouter } = require("./modules/buildings/buildings.routes");
const { createRoomsService } = require("./modules/rooms/rooms.service");
const { createRoomsController } = require("./modules/rooms/rooms.controller");
const { createRoomsRouter } = require("./modules/rooms/rooms.routes");
const { createReservationsService } = require("./modules/reservations/reservations.service");
const { createReservationsController } = require("./modules/reservations/reservations.controller");
const { createReservationsRouter } = require("./modules/reservations/reservations.routes");
const { createAuditLogService } = require("./modules/audit-log/audit-log.service");
const { createAuditLogController } = require("./modules/audit-log/audit-log.controller");
const { createAuditLogRouter } = require("./modules/audit-log/audit-log.routes");

function createApp({
  usersRepository,
  buildingsRepository,
  roomsRepository,
  reservationsRepository,
  auditLogRepository,
  runInTransaction,
  eventBus,
  now,
}) {
  const app = express();

  app.use(requestLogger);
  app.use(express.json());

  const authService = createAuthService({ usersRepository });
  const buildingsService = createBuildingsService({ buildingsRepository, roomsRepository });
  const roomsService = createRoomsService({ roomsRepository, buildingsRepository });
  const reservationsService = createReservationsService({ reservationsRepository, runInTransaction, eventBus, now });
  const auditLogService = createAuditLogService({ auditLogRepository });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi, { swaggerOptions: { persistAuthorization: true } }));
  app.use("/api/auth", createAuthRouter(createAuthController(authService)));

  app.use("/api", authenticate);

  app.use("/api/buildings", createBuildingsRouter(createBuildingsController(buildingsService)));
  app.use("/api/rooms", createRoomsRouter(createRoomsController(roomsService)));
  app.use("/api/reservations", createReservationsRouter(createReservationsController(reservationsService)));
  app.use("/api/admin/audit-log", createAuditLogRouter(createAuditLogController(auditLogService)));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
