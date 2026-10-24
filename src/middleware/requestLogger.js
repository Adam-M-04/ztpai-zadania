const { randomUUID } = require("node:crypto");

function requestLogger(req, res, next) {
  req.id = req.get("X-Request-Id") || randomUUID();
  res.set("X-Request-Id", req.id);

  const start = Date.now();

  res.on("finish", () => {
    const time = Date.now() - start;
    console.log(`[${req.id}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${time} ms)`);
  });

  next();
}

module.exports = requestLogger;
