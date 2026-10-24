const { AppError } = require("../errors/AppError");

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.id,
      },
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body is not valid JSON",
        requestId: req.id,
      },
    });
  }

  if (err.code === "23505") {
    return res.status(409).json({
      error: {
        code: "ALREADY_EXISTS",
        message: "Resource with this name already exists",
        requestId: req.id,
      },
    });
  }

  if (err.code === "23P01") {
    return res.status(409).json({
      error: {
        code: "ROOM_ALREADY_BOOKED",
        message: "Room is already booked in this time",
        requestId: req.id,
      },
    });
  }

  console.error(`[${req.id}]`, err);

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Unexpected error",
      requestId: req.id,
    },
  });
}

module.exports = errorHandler;
