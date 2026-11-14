const { Router } = require("express");
const validate = require("../../middleware/validate");
const authorize = require("../../middleware/authorize");
const { listAuditLogQuery } = require("./audit-log.schemas");

function createAuditLogRouter(controller) {
  const router = Router();

  router.get("/", authorize("ADMIN"), validate({ query: listAuditLogQuery }), controller.list);

  return router;
}

module.exports = { createAuditLogRouter };
