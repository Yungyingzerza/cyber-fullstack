import { Op } from "sequelize";
import { AlertRule, Alert, Event, Tenant } from "../models/index.js";
import { sendDiscordAlert } from "./discord.service.js";
import logger from "../config/logger.js";

// In-memory cache for tracking threshold events
const eventCache = new Map();

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of eventCache.entries()) {
    if (now - data.lastUpdate > 600000) { // 10 minutes
      eventCache.delete(key);
    }
  }
}, 60000); // Every minute

export async function evaluateEvent(event) {
  try {
    const rules = await AlertRule.findAll({
      where: {
        tenant_id: event.tenant_id,
        enabled: true,
      },
    });

    for (const rule of rules) {
      await evaluateRule(rule, event);
    }
  } catch (error) {
    logger.error("Error evaluating alerts:", error);
  }
}

async function evaluateRule(rule, event) {
  // Check if rule matches event
  if (!matchesConditions(rule.conditions, event)) {
    return;
  }

  // Check cooldown
  if (rule.last_triggered_at) {
    const cooldownEnd = new Date(rule.last_triggered_at.getTime() + rule.cooldown_seconds * 1000);
    if (new Date() < cooldownEnd) {
      return;
    }
  }

  if (rule.rule_type === "threshold") {
    await evaluateThresholdRule(rule, event);
  } else if (rule.rule_type === "pattern") {
    await triggerAlert(rule, event, 1);
  }
}

function matchesConditions(conditions, event) {
  if (!conditions) return false;

  // Handle array of conditions (AND logic)
  if (Array.isArray(conditions)) {
    return conditions.every((cond) => matchesCondition(cond, event));
  }

  // Single condition
  return matchesCondition(conditions, event);
}

function matchesCondition(condition, event) {
  const { field, operator, value } = condition;
  const eventValue = event[field];

  switch (operator) {
    case "eq":
      return eventValue === value;
    case "neq":
      return eventValue !== value;
    case "gt":
      return eventValue > value;
    case "gte":
      return eventValue >= value;
    case "lt":
      return eventValue < value;
    case "lte":
      return eventValue <= value;
    case "contains":
      return String(eventValue).toLowerCase().includes(String(value).toLowerCase());
    case "in":
      return Array.isArray(value) && value.includes(eventValue);
    case "regex":
      try {
        return new RegExp(value, "i").test(String(eventValue));
      } catch {
        return false;
      }
    case "exists":
      return eventValue !== null && eventValue !== undefined;
    case "not_exists":
      return eventValue === null || eventValue === undefined;
    default:
      return false;
  }
}

async function evaluateThresholdRule(rule, event) {
  // Build group key
  const groupKey = buildGroupKey(rule.group_by, event);
  const cacheKey = `${rule.id}:${groupKey}`;

  // Get or create cache entry
  let cacheEntry = eventCache.get(cacheKey);
  if (!cacheEntry) {
    cacheEntry = { events: [], lastUpdate: Date.now() };
    eventCache.set(cacheKey, cacheEntry);
  }

  const eventTimestamp = new Date(event.event_time).getTime();

  // Add current event
  cacheEntry.events.push({
    id: event.id,
    timestamp: eventTimestamp,
  });
  cacheEntry.lastUpdate = Date.now();

  // Remove events outside the window (relative to current event time, not wall clock)
  // This allows historical/replayed events to trigger alerts correctly
  const windowStart = eventTimestamp - rule.threshold_window_seconds * 1000;
  cacheEntry.events = cacheEntry.events.filter((e) => e.timestamp >= windowStart);

  // Check if threshold is met
  if (cacheEntry.events.length >= rule.threshold_count) {
    const eventIds = cacheEntry.events.map((e) => e.id);
    await triggerAlert(rule, event, cacheEntry.events.length, groupKey, eventIds);

    // Clear cache to prevent duplicate alerts
    eventCache.delete(cacheKey);
  }
}

function buildGroupKey(groupByFields, event) {
  if (!groupByFields || groupByFields.length === 0) {
    return "global";
  }

  return groupByFields
    .map((field) => `${field}:${event[field] || "unknown"}`)
    .join("|");
}

async function triggerAlert(rule, event, eventCount, groupKey = null, eventIds = []) {
  try {
    // Create alert record
    const alert = await Alert.create({
      tenant_id: event.tenant_id,
      rule_id: rule.id,
      rule_name: rule.name,
      severity: rule.alert_severity,
      title: generateAlertTitle(rule, event, eventCount),
      description: generateAlertDescription(rule, event, eventCount, groupKey),
      event_count: eventCount,
      event_ids: eventIds.slice(0, 100), // Limit stored IDs
      group_key: groupKey,
      context: {
        src_ip: event.src_ip,
        dst_ip: event.dst_ip,
        user: event.user,
        host: event.host,
        source: event.source,
        action: event.action,
        event_type: event.event_type,
      },
      triggered_at: new Date(),
    });

    // Update rule last triggered time
    await rule.update({ last_triggered_at: new Date() });

    logger.info(`Alert triggered: ${alert.id} - ${alert.title}`);

    // Send Discord notification if configured
    if (rule.notify_discord && rule.discord_webhook_url) {
      const notified = await sendDiscordAlert(rule.discord_webhook_url, alert);
      if (notified) {
        await alert.update({ notified: true, notified_at: new Date() });
      }
    }

    return alert;
  } catch (error) {
    logger.error("Failed to trigger alert:", error);
    throw error;
  }
}

function generateAlertTitle(rule, event, eventCount) {
  if (eventCount > 1) {
    return `${rule.name}: ${eventCount} events detected`;
  }
  return `${rule.name}: ${event.event_type || event.action || "Event"} detected`;
}

function generateAlertDescription(rule, event, eventCount, groupKey) {
  const parts = [];

  if (rule.description) {
    parts.push(rule.description);
  }

  if (eventCount > 1) {
    parts.push(`Detected ${eventCount} matching events within ${rule.threshold_window_seconds} seconds.`);
  }

  if (groupKey && groupKey !== "global") {
    parts.push(`Grouped by: ${groupKey}`);
  }

  if (event.src_ip) {
    parts.push(`Source IP: ${event.src_ip}`);
  }

  if (event.user) {
    parts.push(`User: ${event.user}`);
  }

  return parts.join("\n");
}

// CRUD operations for alert rules
export async function createRule(data) {
  return AlertRule.create(data);
}

export async function getRules(tenantId) {
  return AlertRule.findAll({
    where: { tenant_id: tenantId },
    order: [["created_at", "DESC"]],
  });
}

export async function getRuleById(id, tenantId) {
  return AlertRule.findOne({
    where: { id, tenant_id: tenantId },
  });
}

export async function updateRule(id, tenantId, data) {
  const rule = await AlertRule.findOne({
    where: { id, tenant_id: tenantId },
  });

  if (!rule) return null;

  await rule.update(data);
  return rule;
}

export async function deleteRule(id, tenantId) {
  const deleted = await AlertRule.destroy({
    where: { id, tenant_id: tenantId },
  });
  return deleted > 0;
}

// CRUD operations for alerts
export async function getAlerts(tenantId, filters = {}) {
  const where = { tenant_id: tenantId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.severity_min !== undefined) {
    where.severity = { [Op.gte]: filters.severity_min };
  }

  if (filters.rule_id) {
    where.rule_id = filters.rule_id;
  }

  const { page = 1, limit = 50 } = filters;

  const { count, rows } = await Alert.findAndCountAll({
    where,
    include: [
      {
        model: AlertRule,
        attributes: ["id", "name", "description", "rule_type", "enabled"],
      },
    ],
    order: [["triggered_at", "DESC"]],
    limit: Math.min(limit, 100),
    offset: (page - 1) * limit,
  });

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
}

export async function getAlertById(id, tenantId) {
  return Alert.findOne({
    where: { id, tenant_id: tenantId },
    include: [
      {
        model: AlertRule,
        attributes: ["id", "name", "description", "rule_type", "conditions", "threshold_count", "threshold_window_seconds", "group_by"],
      },
    ],
  });
}

export async function updateAlertStatus(id, tenantId, status, userId, notes) {
  const alert = await Alert.findOne({
    where: { id, tenant_id: tenantId },
  });

  if (!alert) return null;

  const updates = { status };

  if (status === "resolved" || status === "closed") {
    updates.resolved_at = new Date();
    updates.resolved_by = userId;
    if (notes) {
      updates.resolution_notes = notes;
    }
  }

  await alert.update(updates);
  return alert;
}

// Create default rules for a tenant
export async function createDefaultRules(tenantId) {
  // Get tenant's Discord webhook if configured
  const tenant = await Tenant.findOne({ where: { name: tenantId } });
  const discordWebhook = tenant?.discord_webhook || "";
  const notifyDiscord = !!discordWebhook;

  // Only one rule: Repeated Failed Logins (as per requirements)
  const defaultRules = [
    {
      tenant_id: tenantId,
      name: "Repeated Failed Logins",
      description: "Detect 5+ failed login attempts from the same IP within 5 minutes",
      rule_type: "threshold",
      conditions: { field: "event_type", operator: "contains", value: "fail" },
      threshold_count: 5,
      threshold_window_seconds: 300,
      group_by: ["src_ip"],
      cooldown_seconds: 300,
      notify_discord: notifyDiscord,
      discord_webhook_url: discordWebhook,
    },
  ];

  const created = [];
  for (const rule of defaultRules) {
    const existing = await AlertRule.findOne({
      where: { tenant_id: tenantId, name: rule.name },
    });

    if (!existing) {
      created.push(await AlertRule.create(rule));
    }
  }

  return created;
}
