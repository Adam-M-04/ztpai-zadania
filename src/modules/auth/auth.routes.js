const { Router } = require("express");
const validate = require("../../middleware/validate");
const authenticate = require("../../middleware/authenticate");
const { registerBody, loginBody } = require("./auth.schemas");

function createAuthRouter(controller) {
  const router = Router();

  router.post("/register", validate({ body: registerBody }), controller.register);
  router.post("/login", validate({ body: loginBody }), controller.login);
  router.get("/me", authenticate, controller.me);

  return router;
}

module.exports = { createAuthRouter };
