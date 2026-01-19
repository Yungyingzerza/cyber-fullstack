import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import tenantRoutes from "./tenant.routes.js";
import ingestRoutes from "./ingest.routes.js";
import eventsRoutes from "./events.routes.js";
import alertsRoutes from "./alerts.routes.js";
import retentionRoutes from "./retention.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/tenants", tenantRoutes);
router.use("/ingest", ingestRoutes);
router.use("/events", eventsRoutes);
router.use("/alerts", alertsRoutes);
router.use("/retention", retentionRoutes);

export default router;
