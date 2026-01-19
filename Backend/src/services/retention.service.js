import { Op } from "sequelize";
import { RetentionPolicy, Event, Alert, Tenant, sequelize } from "../models/index.js";
import logger from "../config/logger.js";
import env from "../config/env.js";

const MIN_RETENTION_DAYS = 7;
const DEFAULT_RETENTION_DAYS = 30;

export async function runCleanup() {
  logger.info("Starting retention cleanup job");

  const policies = await RetentionPolicy.findAll({
    where: { enabled: true },
  });

  let totalDeleted = 0;

  for (const policy of policies) {
    try {
      const deleted = await cleanupTenant(policy);
      totalDeleted += deleted;
    } catch (error) {
      logger.error(`Cleanup failed for tenant ${policy.tenant_id}:`, error);
    }
  }

  // Also clean up tenants without explicit policies using default retention
  const tenantsWithPolicies = policies.map((p) => p.tenant_id);
  const defaultDeleted = await cleanupDefaultTenants(tenantsWithPolicies);
  totalDeleted += defaultDeleted;

  logger.info(`Retention cleanup completed. Total events deleted: ${totalDeleted}`);
  return totalDeleted;
}

async function cleanupTenant(policy) {
  const { tenant_id, retention_days, source_overrides, severity_overrides } = policy;

  let totalDeleted = 0;

  // Get distinct sources for this tenant
  const sources = await Event.findAll({
    where: { tenant_id },
    attributes: [[sequelize.fn("DISTINCT", sequelize.col("source")), "source"]],
    raw: true,
  });

  for (const { source } of sources) {
    // Determine retention for this source
    const sourceRetention = source_overrides?.[source] || retention_days;

    // Delete events by severity tiers
    for (let severity = 0; severity <= 10; severity++) {
      const severityRetention = severity_overrides?.[String(severity)] || sourceRetention;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Math.max(severityRetention, MIN_RETENTION_DAYS));

      const deleted = await Event.destroy({
        where: {
          tenant_id,
          source,
          severity,
          event_time: { [Op.lt]: cutoffDate },
        },
      });

      if (deleted > 0) {
        logger.debug(
          `Deleted ${deleted} events for tenant=${tenant_id}, source=${source}, severity=${severity}`
        );
        totalDeleted += deleted;
      }
    }

    // Handle events with null severity
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Math.max(sourceRetention, MIN_RETENTION_DAYS));

    const deleted = await Event.destroy({
      where: {
        tenant_id,
        source,
        severity: null,
        event_time: { [Op.lt]: cutoffDate },
      },
    });

    if (deleted > 0) {
      totalDeleted += deleted;
    }
  }

  // Update policy stats
  await policy.update({
    last_cleanup_at: new Date(),
    last_cleanup_count: totalDeleted,
  });

  logger.info(`Cleaned up ${totalDeleted} events for tenant ${tenant_id}`);
  return totalDeleted;
}

async function cleanupDefaultTenants(excludeTenants) {
  const defaultRetentionDays = env.retention?.defaultDays || DEFAULT_RETENTION_DAYS;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - Math.max(defaultRetentionDays, MIN_RETENTION_DAYS));

  const where = {
    event_time: { [Op.lt]: cutoffDate },
  };

  if (excludeTenants.length > 0) {
    where.tenant_id = { [Op.notIn]: excludeTenants };
  }

  const deleted = await Event.destroy({ where });

  if (deleted > 0) {
    logger.info(`Cleaned up ${deleted} events from tenants using default retention`);
  }

  return deleted;
}

export async function cleanupAlerts(retentionDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // Only delete closed/resolved alerts
  const deleted = await Alert.destroy({
    where: {
      status: { [Op.in]: ["closed", "resolved"] },
      triggered_at: { [Op.lt]: cutoffDate },
    },
  });

  if (deleted > 0) {
    logger.info(`Cleaned up ${deleted} old alerts`);
  }

  return deleted;
}

// CRUD operations for retention policies
export async function getPolicy(tenantId) {
  return RetentionPolicy.findOne({
    where: { tenant_id: tenantId },
  });
}

export async function createOrUpdatePolicy(tenantId, data) {
  // Enforce minimum retention
  if (data.retention_days && data.retention_days < MIN_RETENTION_DAYS) {
    data.retention_days = MIN_RETENTION_DAYS;
  }

  // Validate source overrides
  if (data.source_overrides) {
    for (const [source, days] of Object.entries(data.source_overrides)) {
      if (days < MIN_RETENTION_DAYS) {
        data.source_overrides[source] = MIN_RETENTION_DAYS;
      }
    }
  }

  // Validate severity overrides
  if (data.severity_overrides) {
    for (const [severity, days] of Object.entries(data.severity_overrides)) {
      if (days < MIN_RETENTION_DAYS) {
        data.severity_overrides[severity] = MIN_RETENTION_DAYS;
      }
    }
  }

  const [policy, created] = await RetentionPolicy.upsert({
    tenant_id: tenantId,
    ...data,
  });

  return { policy, created };
}

export async function deletePolicy(tenantId) {
  const deleted = await RetentionPolicy.destroy({
    where: { tenant_id: tenantId },
  });
  return deleted > 0;
}

export async function getAllPolicies({ includeTenant = false } = {}) {
  const options = {
    order: [["tenant_id", "ASC"]],
  };

  if (includeTenant) {
    options.include = [
      {
        model: Tenant,
        attributes: ["id", "name", "description", "is_active"],
      },
    ];
  }

  return RetentionPolicy.findAll(options);
}

export async function getRetentionStats(tenantId) {
  const policy = await getPolicy(tenantId);

  const now = new Date();
  const stats = {
    policy: policy ? policy.toJSON() : null,
    default_retention_days: env.retention?.defaultDays || DEFAULT_RETENTION_DAYS,
    min_retention_days: MIN_RETENTION_DAYS,
  };

  // Get event counts by age
  const intervals = [1, 7, 14, 30, 60, 90];
  stats.event_counts_by_age = {};

  for (const days of intervals) {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);

    const count = await Event.count({
      where: {
        tenant_id: tenantId,
        event_time: { [Op.gte]: cutoff },
      },
    });

    stats.event_counts_by_age[`last_${days}_days`] = count;
  }

  // Total events
  stats.total_events = await Event.count({
    where: { tenant_id: tenantId },
  });

  // Oldest event
  const oldest = await Event.findOne({
    where: { tenant_id: tenantId },
    order: [["event_time", "ASC"]],
    attributes: ["event_time"],
  });

  if (oldest) {
    stats.oldest_event = oldest.event_time;
    stats.data_age_days = Math.floor(
      (now.getTime() - new Date(oldest.event_time).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return stats;
}
