function toAuditLogEntry(row) {
  return {
    id: row.id,
    eventType: row.event_type,
    payload: row.payload,
    createdAt: row.created_at,
  };
}

function applyFilters(query, filters) {
  if (filters.eventType !== undefined) {
    query.where("event_type", filters.eventType);
  }
  return query;
}

function createAuditLogRepository(db) {
  return {
    async findAll(filters) {
      const rows = await applyFilters(db("audit_log"), filters)
        .orderBy("created_at", "desc")
        .orderBy("id", "desc")
        .limit(filters.limit)
        .offset((filters.page - 1) * filters.limit);

      const [{ count }] = await applyFilters(db("audit_log"), filters).count("id as count");

      return { data: rows.map(toAuditLogEntry), total: Number(count) };
    },

    async create({ eventType, payload }) {
      const [row] = await db("audit_log").insert({ event_type: eventType, payload }).returning("*");
      return toAuditLogEntry(row);
    },
  };
}

module.exports = { createAuditLogRepository };
