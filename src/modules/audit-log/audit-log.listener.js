function createAuditLogListener({ auditLogRepository }) {
  return async (payload, eventType) => {
    await auditLogRepository.create({ eventType, payload });
  };
}

module.exports = { createAuditLogListener };
