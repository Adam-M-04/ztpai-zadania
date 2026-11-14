const { z } = require("zod");

const EVENT_TYPES = ["reservation.created", "reservation.cancelled"];

const listAuditLogQuery = z.object({
  eventType: z.enum(EVENT_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = { EVENT_TYPES, listAuditLogQuery };
