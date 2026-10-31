const { UnauthorizedError, ForbiddenError } = require("../errors/AppError");

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }

    next();
  };
}

module.exports = authorize;
