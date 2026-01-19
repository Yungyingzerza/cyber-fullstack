import logger from "../config/logger.js";

let geoip = null;

async function loadGeoIP() {
  if (geoip) return geoip;

  try {
    geoip = await import("geoip-lite");
    logger.info("GeoIP database loaded successfully");
    return geoip;
  } catch (error) {
    logger.warn("GeoIP module not available. Install with: bun add geoip-lite");
    return null;
  }
}

function isPrivateIP(ip) {
  if (!ip) return true;

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return true;

  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;

  return false;
}

export async function lookupGeoIP(ip) {
  if (!ip || isPrivateIP(ip)) {
    return null;
  }

  const geo = await loadGeoIP();
  if (!geo) return null;

  try {
    const result = geo.default?.lookup?.(ip) || geo.lookup?.(ip);

    if (!result) return null;

    return {
      country: result.country || null,
      region: result.region || null,
      city: result.city || null,
      latitude: result.ll?.[0] || null,
      longitude: result.ll?.[1] || null,
      timezone: result.timezone || null,
    };
  } catch (error) {
    logger.debug(`GeoIP lookup failed for ${ip}: ${error.message}`);
    return null;
  }
}

export async function enrichWithGeoIP(event) {
  const enriched = { ...event };

  if (event.src_ip && !isPrivateIP(event.src_ip)) {
    const geo = await lookupGeoIP(event.src_ip);
    if (geo) {
      enriched.src_geo_country = geo.country;
      enriched.src_geo_city = geo.city;
      enriched.src_geo_latitude = geo.latitude;
      enriched.src_geo_longitude = geo.longitude;

      if (!enriched._tags) enriched._tags = [];
      if (geo.country) {
        enriched._tags.push(`country:${geo.country}`);
      }
    }
  }

  if (event.dst_ip && !isPrivateIP(event.dst_ip)) {
    const geo = await lookupGeoIP(event.dst_ip);
    if (geo) {
      enriched.dst_geo_country = geo.country;
      enriched.dst_geo_city = geo.city;
      enriched.dst_geo_latitude = geo.latitude;
      enriched.dst_geo_longitude = geo.longitude;
    }
  }

  return enriched;
}

export async function initGeoIP() {
  await loadGeoIP();
}
