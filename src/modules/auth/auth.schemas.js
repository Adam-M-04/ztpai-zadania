const { z } = require("zod");

const registerBody = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(10).max(72),
  })
  .strict();

module.exports = { registerBody };
