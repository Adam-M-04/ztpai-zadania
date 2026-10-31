require("dotenv").config({ quiet: true });
const { z } = require("zod");

function message(text) {
  return (issue) => (issue.input === undefined ? "is required" : text);
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number({ error: "must be a number" }).int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: message("must be a postgres:// connection URL") }),
  JWT_SECRET: z.string({ error: message("must be a string") }).min(32, "must be at least 32 characters long"),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, "must be a number with unit s, m, h or d (e.g. 15m)")
    .default("15m"),
  SEED_ADMIN_PASSWORD: z.string().min(10).max(72).optional(),
  SEED_USER_PASSWORD: z.string().min(10).max(72).optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid configuration:");
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const env = result.data;

module.exports = {
  env: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  seed: {
    adminPassword: env.SEED_ADMIN_PASSWORD,
    userPassword: env.SEED_USER_PASSWORD,
  },
};
