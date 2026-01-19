import { enrichWithDns } from "./dns.enricher.js";
import { enrichWithGeoIP, initGeoIP } from "./geoip.enricher.js";
import logger from "../config/logger.js";
import env from "../config/env.js";

let initialized = false;

export async function initEnrichment() {
  if (initialized) return;

  if (env.enrichment?.geoip) {
    await initGeoIP();
  }

  initialized = true;
  logger.info("Enrichment pipeline initialized");
}

export async function enrich(event) {
  if (!env.enrichment?.enabled) {
    return event;
  }

  let enriched = { ...event };

  try {
    if (env.enrichment?.dns) {
      enriched = await enrichWithDns(enriched);
    }

    if (env.enrichment?.geoip) {
      enriched = await enrichWithGeoIP(enriched);
    }

    // Deduplicate tags
    if (enriched._tags) {
      enriched._tags = [...new Set(enriched._tags)];
    }

  } catch (error) {
    logger.error("Enrichment pipeline error:", error);
  }

  return enriched;
}

export async function enrichBatch(events) {
  if (!env.enrichment?.enabled) {
    return events;
  }

  return Promise.all(events.map(enrich));
}

export { enrichWithDns, enrichWithGeoIP };
