import Joi from "joi";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const envSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE: Joi.string().required().description("PostgreSQL database name"),
  DB_USER: Joi.string().required().description("PostgreSQL username"),
  DB_PASSWORD: Joi.string().required().description("PostgreSQL password"),
  DB_HOST: Joi.string().default("localhost"),
  DB_PORT: Joi.number().default(5432),

  // JWT
  JWT_SECRET: Joi.string().min(32).required().description("JWT signing secret"),
  JWT_EXPIRES_IN: Joi.string().default("7d"),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "debug")
    .default("info"),

  // Syslog
  SYSLOG_ENABLED: Joi.boolean().default(false),
  SYSLOG_PORT: Joi.number().default(514),
  SYSLOG_TENANT: Joi.string().default("default"),

  // Enrichment
  ENRICHMENT_ENABLED: Joi.boolean().default(true),
  ENRICHMENT_DNS: Joi.boolean().default(true),
  ENRICHMENT_GEOIP: Joi.boolean().default(true),

  // Retention
  RETENTION_ENABLED: Joi.boolean().default(true),
  RETENTION_DEFAULT_DAYS: Joi.number().integer().min(7).default(30),
  RETENTION_INTERVAL_HOURS: Joi.number().integer().min(1).default(24),
  RETENTION_RUN_ON_STARTUP: Joi.boolean().default(false),
  RETENTION_ALERT_DAYS: Joi.number().integer().min(7).default(90),

}).unknown();

const { value: env, error } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  const missingVars = error.details.map((d) => `  - ${d.message}`).join("\n");
  console.error("Environment validation failed:\n" + missingVars);
  console.error("\nCheck your .env file or environment variables.");
  process.exit(1);
}

export default {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  db: {
    database: env.DATABASE,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    host: env.DB_HOST,
    port: env.DB_PORT,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  logLevel: env.LOG_LEVEL,
  syslog: {
    enabled: env.SYSLOG_ENABLED,
    port: env.SYSLOG_PORT,
    tenant: env.SYSLOG_TENANT,
  },
  enrichment: {
    enabled: env.ENRICHMENT_ENABLED,
    dns: env.ENRICHMENT_DNS,
    geoip: env.ENRICHMENT_GEOIP,
  },
  retention: {
    enabled: env.RETENTION_ENABLED,
    defaultDays: env.RETENTION_DEFAULT_DAYS,
    intervalHours: env.RETENTION_INTERVAL_HOURS,
    runOnStartup: env.RETENTION_RUN_ON_STARTUP,
    alertRetentionDays: env.RETENTION_ALERT_DAYS,
  },
};
