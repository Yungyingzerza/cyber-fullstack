import logger from "../config/logger.js";
import env from "../config/env.js";
import { runCleanup, cleanupAlerts } from "./retention.service.js";

let cleanupInterval = null;

export function startScheduler() {
  if (!env.retention?.enabled) {
    logger.info("Retention scheduler disabled");
    return;
  }

  const intervalMs = (env.retention?.intervalHours || 24) * 60 * 60 * 1000;

  logger.info(
    `Starting retention scheduler (interval: ${env.retention?.intervalHours || 24} hours)`
  );

  // Run cleanup job at interval
  cleanupInterval = setInterval(async () => {
    try {
      await runScheduledCleanup();
    } catch (error) {
      logger.error("Scheduled cleanup failed:", error);
    }
  }, intervalMs);

  // Run initial cleanup after a short delay (allow app to fully start)
  if (env.retention?.runOnStartup) {
    setTimeout(async () => {
      try {
        logger.info("Running startup cleanup");
        await runScheduledCleanup();
      } catch (error) {
        logger.error("Startup cleanup failed:", error);
      }
    }, 30000); // 30 seconds after startup
  }
}

async function runScheduledCleanup() {
  const startTime = Date.now();
  logger.info("Starting scheduled retention cleanup");

  try {
    // Clean up events
    const eventsDeleted = await runCleanup();

    // Clean up old alerts (resolved/closed older than 90 days)
    const alertsDeleted = await cleanupAlerts(env.retention?.alertRetentionDays || 90);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(
      `Scheduled cleanup completed in ${duration}s: ${eventsDeleted} events, ${alertsDeleted} alerts deleted`
    );
  } catch (error) {
    logger.error("Scheduled cleanup error:", error);
    throw error;
  }
}

export function stopScheduler() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info("Retention scheduler stopped");
  }
}

export async function triggerManualCleanup() {
  logger.info("Manual cleanup triggered");
  return runScheduledCleanup();
}
