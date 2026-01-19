import { Router } from "express";
import * as tenantService from "../services/tenant.service.js";
import { validate, createTenantSchema, updateTenantSchema } from "../validators/tenant.validator.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// All tenant routes require authentication and admin role
router.use(authenticate);
router.use(requireRole("admin"));

// Create tenant
router.post("/", validate(createTenantSchema), async (req, res, next) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    res.status(201).json({
      message: "Tenant created successfully",
      tenant,
    });
  } catch (error) {
    next(error);
  }
});

// Get all tenants
router.get("/", async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const tenants = await tenantService.getAllTenants({ includeInactive });
    res.json({ tenants });
  } catch (error) {
    next(error);
  }
});

// Get tenant by ID
router.get("/:id", async (req, res, next) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    res.json({ tenant });
  } catch (error) {
    next(error);
  }
});

// Update tenant
router.put("/:id", validate(updateTenantSchema), async (req, res, next) => {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    res.json({
      message: "Tenant updated successfully",
      tenant,
    });
  } catch (error) {
    next(error);
  }
});

// Delete tenant
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await tenantService.deleteTenant(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
