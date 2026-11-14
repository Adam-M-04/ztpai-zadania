const { toAuditLogResponse } = require("./audit-log.mapper");

function createAuditLogController(auditLogService) {
  return {
    async list(req, res) {
      const result = await auditLogService.listAuditLog(req.validated.query);
      res.json({ data: result.data.map(toAuditLogResponse), meta: result.meta });
    },
  };
}

module.exports = { createAuditLogController };
