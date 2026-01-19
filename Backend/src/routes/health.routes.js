import { Router } from "express";
import { sequelize } from "../config/database.js";

const router = Router();

router.get("/", async (req, res) => {
  const healthcheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {},
  };

  try {
    await sequelize.authenticate();
    healthcheck.checks.database = { status: "ok" };
  } catch (error) {
    healthcheck.status = "degraded";
    healthcheck.checks.database = { status: "error", message: error.message };
  }

  const statusCode = healthcheck.status === "ok" ? 200 : 503;
  res.status(statusCode).json(healthcheck);
});

export default router;
