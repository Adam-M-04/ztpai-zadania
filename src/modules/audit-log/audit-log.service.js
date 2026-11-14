function createAuditLogService({ auditLogRepository }) {
  async function listAuditLog(filters) {
    const { data, total } = await auditLogRepository.findAll(filters);

    return {
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  return { listAuditLog };
}

module.exports = { createAuditLogService };
