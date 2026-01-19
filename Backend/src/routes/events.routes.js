import { Router } from "express";
import { authenticate, requireRole, tenantIsolation } from "../middlewares/auth.middleware.js";
import { validateQuery, validateBody, querySchema, statsSchema, deleteSchema } from "../validators/events.validator.js";
import * as eventsService from "../services/events.service.js";

const router = Router();

// GET /events - Query events with filters and pagination
router.get("/", authenticate, tenantIsolation, validateQuery(querySchema), async (req, res, next) => {
  try {
    const {
      page,
      limit,
      sort_by,
      sort_order,
      ...filters
    } = req.validatedQuery;

    // Add tenant_id from authenticated user
    filters.tenant_id = req.user.tenant_id;

    const result = await eventsService.queryEvents(filters, {
      page,
      limit,
      sort_by,
      sort_order,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /events/stats - Get event statistics
router.get("/stats", authenticate, tenantIsolation, validateQuery(statsSchema), async (req, res, next) => {
  try {
    const stats = await eventsService.getEventStats(req.user.tenant_id, req.validatedQuery);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /events/:id - Get single event by ID
router.get("/:id", authenticate, tenantIsolation, async (req, res, next) => {
  try {
    const event = await eventsService.getEventById(req.params.id, req.user.tenant_id);

    if (!event) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
});

// DELETE /events/:id - Delete single event (admin only)
router.delete("/:id", authenticate, requireRole("admin"), tenantIsolation, async (req, res, next) => {
  try {
    const deleted = await eventsService.deleteEvent(req.params.id, req.user.tenant_id);

    if (!deleted) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    res.json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /events - Bulk delete events (admin only)
router.delete("/", authenticate, requireRole("admin"), tenantIsolation, validateBody(deleteSchema), async (req, res, next) => {
  try {
    const deleted = await eventsService.deleteEvents(req.body, req.user.tenant_id);

    res.json({
      message: "Events deleted successfully",
      count: deleted,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
