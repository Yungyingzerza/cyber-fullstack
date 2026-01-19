import { Sequelize } from "sequelize";
import env from "./env.js";
import logger from "./logger.js";

const sequelize = new Sequelize(
  env.db.database,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: "postgres",
    logging: env.nodeEnv === "development" ? (msg) => logger.debug(msg) : false,
  }
);

async function connect() {
  try {
    await sequelize.authenticate();
    logger.info("Database connection established");
  } catch (error) {
    logger.error("Unable to connect to database:", error);
    throw error;
  }
}

async function sync() {
  try {
    await sequelize.sync();
    logger.info("Database synchronized");
  } catch (error) {
    logger.error("Unable to sync database:", error);
    throw error;
  }
}

export { sequelize, connect, sync };
