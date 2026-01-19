import express from "express";
import cors from "cors";
import env from "./config/env.js";
import { connect, sync } from "./config/database.js";
import logger from "./config/logger.js";
import routes from "./routes/index.js";
// Import models to ensure associations are loaded before sync
import "./models/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { startSyslogServer } from "./services/syslog.service.js";
import { initEnrichment } from "./enrichment/index.js";
import { startScheduler } from "./services/scheduler.service.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://cyber.yungying.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Swagger API Documentation
setupSwagger(app);

// Routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Cyber Security Log Platform",
    version: "1.0.0",
    docs: "/api/docs",
    health: "/api/health",
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function start() {
  try {
    await connect();
    await sync();
    await initEnrichment();

    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`);
    });

    if (env.syslog.enabled) {
      startSyslogServer(env.syslog.port, env.syslog.tenant);
    }

    // Start retention scheduler
    startScheduler();
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
