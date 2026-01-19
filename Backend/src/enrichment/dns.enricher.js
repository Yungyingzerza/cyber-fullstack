import dns from "dns";
import { promisify } from "util";
import logger from "../config/logger.js";

const reverseLookup = promisify(dns.reverse);

const dnsCache = new Map();
const DNS_CACHE_TTL = 3600000; // 1 hour
const DNS_TIMEOUT = 2000; // 2 seconds

function isPrivateIP(ip) {
  if (!ip) return true;

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return true;

  // 10.0.0.0/8
  if (parts[0] === 10) return true;

  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 127.0.0.0/8 (loopback)
  if (parts[0] === 127) return true;

  // 169.254.0.0/16 (link-local)
  if (parts[0] === 169 && parts[1] === 254) return true;

  return false;
}

function getCacheKey(ip) {
  return `dns:${ip}`;
}

function getFromCache(ip) {
  const key = getCacheKey(ip);
  const cached = dnsCache.get(key);

  if (cached && Date.now() - cached.timestamp < DNS_CACHE_TTL) {
    return cached.hostname;
  }

  if (cached) {
    dnsCache.delete(key);
  }

  return null;
}

function setCache(ip, hostname) {
  const key = getCacheKey(ip);
  dnsCache.set(key, {
    hostname,
    timestamp: Date.now(),
  });
}

export async function reverseDns(ip) {
  if (!ip || isPrivateIP(ip)) {
    return null;
  }

  const cached = getFromCache(ip);
  if (cached !== null) {
    return cached || null;
  }

  try {
    const hostnames = await Promise.race([
      reverseLookup(ip),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DNS timeout")), DNS_TIMEOUT)
      ),
    ]);

    const hostname = hostnames && hostnames.length > 0 ? hostnames[0] : null;
    setCache(ip, hostname || "");
    return hostname;
  } catch (error) {
    if (error.code !== "ENOTFOUND" && error.message !== "DNS timeout") {
      logger.debug(`Reverse DNS lookup failed for ${ip}: ${error.message}`);
    }
    setCache(ip, "");
    return null;
  }
}

export async function enrichWithDns(event) {
  const enriched = { ...event };
  const lookups = [];

  if (event.src_ip && !isPrivateIP(event.src_ip)) {
    lookups.push(
      reverseDns(event.src_ip).then((hostname) => {
        if (hostname) {
          enriched.src_hostname = hostname;
        }
      })
    );
  }

  if (event.dst_ip && !isPrivateIP(event.dst_ip)) {
    lookups.push(
      reverseDns(event.dst_ip).then((hostname) => {
        if (hostname) {
          enriched.dst_hostname = hostname;
        }
      })
    );
  }

  await Promise.all(lookups);
  return enriched;
}

export function clearDnsCache() {
  dnsCache.clear();
}

export function getDnsCacheStats() {
  return {
    size: dnsCache.size,
    ttl: DNS_CACHE_TTL,
  };
}
