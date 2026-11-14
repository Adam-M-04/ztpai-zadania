const { createAuditLogListener } = require("../modules/audit-log/audit-log.listener");
const { createCancelNotificationListener } = require("../modules/notifications/notifications.listener");

function registerListeners(eventBus, { auditLogRepository, usersRepository }) {
  const auditLog = createAuditLogListener({ auditLogRepository });

  eventBus.subscribe("reservation.created", auditLog);
  eventBus.subscribe("reservation.cancelled", auditLog);
  eventBus.subscribe("reservation.cancelled", createCancelNotificationListener({ usersRepository }));
}

module.exports = { registerListeners };
