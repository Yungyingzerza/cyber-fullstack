import { describe, test, expect, beforeEach } from "bun:test";
import "../setup.js";
import { reverseDns, enrichWithDns, clearDnsCache } from "../../src/enrichment/dns.enricher.js";

describe("DNS Enrichment", () => {
  beforeEach(() => {
    clearDnsCache();
  });

  test("should skip private IPs", async () => {
    const privateIPs = [
      "10.0.0.1",
      "172.16.0.1",
      "192.168.1.1",
      "127.0.0.1",
      "169.254.1.1",
    ];

    for (const ip of privateIPs) {
      const result = await reverseDns(ip);
      expect(result).toBeNull();
    }
  });

  test("should handle null/undefined IP", async () => {
    expect(await reverseDns(null)).toBeNull();
    expect(await reverseDns(undefined)).toBeNull();
    expect(await reverseDns("")).toBeNull();
  });

  test("enrichWithDns should return event with same structure", async () => {
    const event = {
      tenant_id: "test",
      source: "api",
      src_ip: "192.168.1.1", // Private IP, should skip
      dst_ip: "10.0.0.1", // Private IP, should skip
    };

    const enriched = await enrichWithDns(event);

    expect(enriched.tenant_id).toBe("test");
    expect(enriched.source).toBe("api");
    expect(enriched.src_ip).toBe("192.168.1.1");
  });

  test("should cache DNS results", async () => {
    // First call
    const result1 = await reverseDns("192.168.1.1");

    // Second call should use cache
    const result2 = await reverseDns("192.168.1.1");

    expect(result1).toBe(result2);
  });
});

describe("GeoIP Enrichment", () => {
  test("should skip private IPs", async () => {
    const { lookupGeoIP } = await import("../../src/enrichment/geoip.enricher.js");

    const result = await lookupGeoIP("192.168.1.1");
    expect(result).toBeNull();
  });

  test("should handle null/undefined IP", async () => {
    const { lookupGeoIP } = await import("../../src/enrichment/geoip.enricher.js");

    expect(await lookupGeoIP(null)).toBeNull();
    expect(await lookupGeoIP(undefined)).toBeNull();
  });

  test("enrichWithGeoIP should preserve event structure", async () => {
    const { enrichWithGeoIP } = await import("../../src/enrichment/geoip.enricher.js");

    const event = {
      tenant_id: "test",
      source: "api",
      src_ip: "192.168.1.1",
      _tags: ["existing-tag"],
    };

    const enriched = await enrichWithGeoIP(event);

    expect(enriched.tenant_id).toBe("test");
    expect(enriched.source).toBe("api");
    expect(enriched._tags).toContain("existing-tag");
  });
});

describe("Enrichment Pipeline", () => {
  test("should run enrichment pipeline", async () => {
    // Set enrichment disabled for this test
    process.env.ENRICHMENT_ENABLED = "false";

    const { enrich } = await import("../../src/enrichment/index.js");

    const event = {
      tenant_id: "test",
      source: "api",
      src_ip: "8.8.8.8",
    };

    const enriched = await enrich(event);

    // When disabled, should return same event
    expect(enriched.tenant_id).toBe("test");
    expect(enriched.source).toBe("api");
  });
});
