import { Router } from "express";
import { authenticate, requireRole, tenantIsolation } from "../middlewares/auth.middleware.js";
import { validate, policySchema, updatePolicySchema } from "../validators/retention.validator.js";
import * as retentionService from "../services/retention.service.js";
import { triggerManualCleanup } from "../services/scheduler.service.js";

const router = Router();

// GET /retention/policy - Get current tenant's retention policy
router.get("/policy", authenticate, tenantIsolation, async (req, res, next) => {
  try {
    const policy = await retentionService.getPolicy(req.user.tenant_id);

    if (!policy) {
      return res.json({
        message: "No custom policy configured, using default",
        policy: null,
        default_retention_days: 30,
      });
    }

    res.json(policy);
  } catch (error) {
    next(error);
  }
});

// PUT /retention/policy - Create or update retention policy
router.put(
  "/policy",
  authenticate,
  requireRole("admin"),
  tenantIsolation,
  validate(policySchema),
  async (req, res, next) => {
    try {
      const { policy, created } = await retentionService.createOrUpdatePolicy(
        req.user.tenant_id,
        req.body
      );

      res.json({
        message: created ? "Policy created" : "Policy updated",
        policy,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /retention/policy - Partial update retention policy
router.patch(
  "/policy",
  authenticate,
  requireRole("admin"),
  tenantIsolation,
  validate(updatePolicySchema),
  async (req, res, next) => {
    try {
      const existing = await retentionService.getPolicy(req.user.tenant_id);

      if (!existing) {
        return res.status(404).json({
          error: "No policy exists. Use PUT to create one.",
        });
      }

      const { policy } = await retentionService.createOrUpdatePolicy(
        req.user.tenant_id,
        { ...existing.toJSON(), ...req.body }
      );

      res.json({
        message: "Policy updated",
        policy,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /retention/policy - Delete retention policy (revert to default)
router.delete(
  "/policy",
  authenticate,
  requireRole("admin"),
  tenantIsolation,
  async (req, res, next) => {
    try {
      const deleted = await retentionService.deletePolicy(req.user.tenant_id);

      if (!deleted) {
        return res.status(404).json({
          error: "No policy found",
        });
      }

      res.json({
        message: "Policy deleted, tenant will use default retention",
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /retention/stats - Get retention statistics
router.get("/stats", authenticate, tenantIsolation, async (req, res, next) => {
  try {
    const stats = await retentionService.getRetentionStats(req.user.tenant_id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// POST /retention/cleanup - Trigger manual cleanup (admin only)
router.post(
  "/cleanup",
  authenticate,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      // Run cleanup in background
      triggerManualCleanup().catch((err) => {
        console.error("Manual cleanup error:", err);
      });

      res.json({
        message: "Cleanup job started",
        note: "Check logs for progress",
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /retention/policies - List all policies (admin only, for system admins)
router.get(
  "/policies",
  authenticate,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const policies = await retentionService.getAllPolicies();
      res.json({ data: policies });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
