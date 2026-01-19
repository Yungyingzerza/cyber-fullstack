import { Event } from "../models/index.js";
import logger from "../config/logger.js";
import { normalize, detectNormalizer } from "../normalizers/index.js";
import { enrich, enrichBatch } from "../enrichment/index.js";
import { evaluateEvent } from "./alerting.service.js";

export async function ingestEvent(eventData, tenantId) {
  const normalized = normalizeEvent(eventData, tenantId);
  const enriched = await enrich(normalized);
  const event = await Event.create(enriched);
  logger.debug(`Ingested event ${event.id} for tenant ${tenantId}`);

  // Evaluate alert rules asynchronously (don't block ingestion)
  evaluateEvent(event.toJSON()).catch((err) => {
    logger.error("Alert evaluation failed:", err);
  });

  return event;
}

export async function ingestBatch(events, tenantId) {
  const normalized = events.map((e) => normalizeEvent(e, tenantId));
  const enriched = await enrichBatch(normalized);
  const created = await Event.bulkCreate(enriched);
  logger.info(`Ingested ${created.length} events for tenant ${tenantId}`);

  // Evaluate alert rules for each event asynchronously
  for (const event of created) {
    evaluateEvent(event.toJSON()).catch((err) => {
      logger.error("Alert evaluation failed:", err);
    });
  }

  return created;
}

function normalizeEvent(data, tenantId) {
  const tenant = tenantId || data.tenant_id || data.tenant;

  if (!tenant) {
    throw new Error("tenant_id is required");
  }

  const normalized = normalize(data, tenant);

  if (!normalized.tenant_id) {
    normalized.tenant_id = tenant;
  }

  return normalized;
}

export async function ingestSyslog(message, rinfo, tenantId) {
  const normalizer = detectNormalizer(message);
  const normalized = normalizer.normalize(message, tenantId);

  if (rinfo?.address) {
    normalized.src_ip = normalized.src_ip || rinfo.address;
  }

  return ingestEvent(normalized, tenantId);
}
