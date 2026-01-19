import { Router } from "express";
import { authenticate, requireRole, tenantIsolation } from "../middlewares/auth.middleware.js";
import {
  validate,
  validateQuery,
  createRuleSchema,
  updateRuleSchema,
  updateAlertStatusSchema,
  alertQuerySchema,
} from "../validators/alerts.validator.js";
import * as alertingService from "../services/alerting.service.js";

const router = Router();

// ==================== Alert Rules ====================

// GET /alerts/rules - List all rules
router.get("/rules", authenticate, tenantIsolation, async (req, res, next) => {
  try {
    const rules = await alertingService.getRules(req.user.tenant_id);
    res.json({ data: rules });
  } catch (error) {
    next(error);
  }
});

// POST /alerts/rules - Create a new rule
router.post(
  "/rules",
  authenticate,
  requireRole("admin"),
  tenantIsolation,
  validate(createRuleSchema),
  async (req, res, next) => {
    try {
      const rule = await alertingService.createRule({
        ...req.body,
        tenant_id: req.user.tenant_id,
      });
      res.status(201).json({
        message: "Alert rule created successfully",
        rule,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /alerts/rules/defaults - Create default rules
router.post(
  "/rules/defaults",
  authenticate,
  requireRole("admin"),
  tenantIsolation,
  async (req, res, next) => {
    try {
      const created = await alertingService.createDefaultRules(req.user.tenant_id);
      res.status(201).json({
        message: "Default rules created",
        count: created.length,
        rules: created,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /alerts/rules/:id - Get single rule
router.get("/rules/:id", authenticate, tenantIsolation, async (req, res, next) => {
  try {
    const rule = await alertingService.getRuleById(req.params.id, req.user.tenant_id);

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    res.json(rule);
  } catch (error) {
    next(error);
  }
});

// PUT /alerts/rules/:id - Update rule
router.put(
  "/rules/:id",
  authenticate,
  requireRole("admin"),
  tenantIsolation,
  validate(updateRuleSchema),
  async (req, res, next) => {
    try {
      const rule = await alertingService.updateRule(
        req.params.id,
        req.user.tenant_id,
        req.body
      );

      if (!rule) {
        return res.status(404).json({ error: "Rule not found" });
      }

      res.json({
        message: "Rule updated successfully",
        rule,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /alerts/rules/:id - Delete rule
router.delete(
  "/rules/:id",
  authenticate,
  requireRole("admin"),
  tenantIsolation,
  async (req, res, next) => {
    try {
      const deleted = await alertingService.deleteRule(req.params.id, req.user.tenant_id);

      if (!deleted) {
        return res.status(404).json({ error: "Rule not found" });
      }

      res.json({ message: "Rule deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Alerts ====================

// GET /alerts - List alerts
router.get("/", authenticate, tenantIsolation, validateQuery(alertQuerySchema), async (req, res, next) => {
  try {
    const result = await alertingService.getAlerts(req.user.tenant_id, req.validatedQuery);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /alerts/:id - Get single alert
router.get("/:id", authenticate, tenantIsolation, async (req, res, next) => {
  try {
    const alert = await alertingService.getAlertById(req.params.id, req.user.tenant_id);

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json(alert);
  } catch (error) {
    next(error);
  }
});

// PATCH /alerts/:id/status - Update alert status
router.patch(
  "/:id/status",
  authenticate,
  tenantIsolation,
  validate(updateAlertStatusSchema),
  async (req, res, next) => {
    try {
      const alert = await alertingService.updateAlertStatus(
        req.params.id,
        req.user.tenant_id,
        req.body.status,
        req.user.email,
        req.body.notes
      );

      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      res.json({
        message: "Alert status updated",
        alert,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
