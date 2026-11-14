function toAuditLogEntry(row) {
  return {
    id: row.id,
    eventType: row.event_type,
    payload: row.payload,
    createdAt: row.created_at,
  };
}

function createAuditLogRepository(db) {
  return {
    async create({ eventType, payload }) {
      const [row] = await db("audit_log").insert({ event_type: eventType, payload }).returning("*");
      return toAuditLogEntry(row);
    },
  };
}

module.exports = { createAuditLogRepository };
