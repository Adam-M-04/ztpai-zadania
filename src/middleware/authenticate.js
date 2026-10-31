const jwt = require("jsonwebtoken");
const config = require("../config");
const { UnauthorizedError } = require("../errors/AppError");

function authenticate(req, res, next) {
  const header = req.get("Authorization");

  if (!header) {
    return next(new UnauthorizedError("Missing Authorization header"));
  }

  const match = header.match(/^Bearer (\S+)$/);

  if (!match) {
    return next(new UnauthorizedError("Authorization header must be: Bearer <token>"));
  }

  try {
    const payload = jwt.verify(match[1], config.jwt.secret, { algorithms: ["HS256"] });
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Token expired", "TOKEN_EXPIRED"));
    }
    next(new UnauthorizedError("Invalid token", "INVALID_TOKEN"));
  }
}

module.exports = authenticate;
