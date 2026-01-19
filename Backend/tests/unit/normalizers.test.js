import { describe, test, expect } from "bun:test";
import { FirewallNormalizer } from "../../src/normalizers/firewall.normalizer.js";
import { NetworkNormalizer } from "../../src/normalizers/network.normalizer.js";
import { ApiNormalizer } from "../../src/normalizers/api.normalizer.js";
import { CrowdStrikeNormalizer } from "../../src/normalizers/crowdstrike.normalizer.js";
import { AwsNormalizer } from "../../src/normalizers/aws.normalizer.js";
import { M365Normalizer } from "../../src/normalizers/m365.normalizer.js";
import { AdNormalizer } from "../../src/normalizers/ad.normalizer.js";
import { normalize, detectNormalizer } from "../../src/normalizers/index.js";

describe("FirewallNormalizer", () => {
  const normalizer = new FirewallNormalizer();

  test("should parse syslog message correctly", () => {
    const syslog = "<134>Aug 20 12:44:56 fw01 vendor=demo product=ngfw action=deny src=10.0.1.10 dst=8.8.8.8 spt=5353 dpt=53 proto=udp";
    const result = normalizer.normalize(syslog, "test-tenant");

    expect(result.tenant_id).toBe("test-tenant");
    expect(result.source).toBe("firewall");
    expect(result.host).toBe("fw01");
    expect(result.vendor).toBe("demo");
    expect(result.product).toBe("ngfw");
    expect(result.action).toBe("deny");
    expect(result.src_ip).toBe("10.0.1.10");
    expect(result.dst_ip).toBe("8.8.8.8");
    expect(result.src_port).toBe(5353);
    expect(result.dst_port).toBe(53);
    expect(result.protocol).toBe("udp");
  });

  test("should extract severity from priority", () => {
    const syslog = "<134>Aug 20 12:44:56 fw01 action=deny";
    const result = normalizer.normalize(syslog, "test-tenant");

    expect(result.severity).toBeDefined();
    expect(result.severity).toBeGreaterThanOrEqual(0);
    expect(result.severity).toBeLessThanOrEqual(10);
  });

  test("should handle JSON input", () => {
    const data = {
      source: "firewall",
      vendor: "paloalto",
      action: "allow",
      src_ip: "192.168.1.1",
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result.vendor).toBe("paloalto");
    expect(result.action).toBe("allow");
    expect(result.src_ip).toBe("192.168.1.1");
  });

  test("should detect firewall syslog", () => {
    const syslog = "<134>Aug 20 12:44:56 fw01 vendor=demo action=deny";
    expect(normalizer.canHandle(syslog)).toBe(true);
  });
});

describe("NetworkNormalizer", () => {
  const normalizer = new NetworkNormalizer();

  test("should parse network syslog correctly", () => {
    const syslog = "<190>Aug 20 13:01:02 r1 if=ge-0/0/1 event=link-down mac=aa:bb:cc:dd:ee:ff reason=carrier-loss";
    const result = normalizer.normalize(syslog, "test-tenant");

    expect(result.source).toBe("network");
    expect(result.host).toBe("r1");
    expect(result.event_type).toBe("link-down");
    expect(result.event_subtype).toBe("ge-0/0/1");
    expect(result._tags).toContain("outage");
  });

  test("should detect network events", () => {
    const syslog = "<190>Aug 20 13:01:02 r1 event=link-up";
    expect(normalizer.canHandle(syslog)).toBe(true);
  });
});

describe("ApiNormalizer", () => {
  const normalizer = new ApiNormalizer();

  test("should normalize login failed event", () => {
    const data = {
      source: "api",
      event_type: "app_login_failed",
      user: "alice",
      ip: "203.0.113.7",
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result.action).toBe("deny");
    expect(result.user).toBe("alice");
    expect(result.src_ip).toBe("203.0.113.7");
    expect(result._tags).toContain("auth-failure");
  });

  test("should normalize login success event", () => {
    const data = {
      source: "api",
      event_type: "app_login_success",
      user: "bob",
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result.action).toBe("login");
    expect(result._tags).toContain("auth-success");
  });
});

describe("CrowdStrikeNormalizer", () => {
  const normalizer = new CrowdStrikeNormalizer();

  test("should normalize malware event", () => {
    const data = {
      source: "crowdstrike",
      event_type: "malware_detected",
      host: "WIN10-01",
      process: "powershell.exe",
      severity: 8,
      action: "quarantine",
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result.action).toBe("deny");
    expect(result.host).toBe("WIN10-01");
    expect(result.process).toBe("powershell.exe");
    expect(result._tags).toContain("malware");
    expect(result._tags).toContain("prevented");
  });

  test("should detect ransomware and set high severity", () => {
    const data = {
      source: "crowdstrike",
      event_type: "ransomware_behavior",
      severity: 5,
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result.severity).toBeGreaterThanOrEqual(9);
    expect(result._tags).toContain("ransomware");
    expect(result._tags).toContain("critical-threat");
  });
});

describe("AwsNormalizer", () => {
  const normalizer = new AwsNormalizer();

  test("should normalize CreateUser event", () => {
    const data = {
      source: "aws",
      event_type: "CreateUser",
      user: "admin",
      cloud: { service: "iam", account_id: "123456789", region: "us-east-1" },
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result.action).toBe("create");
    expect(result.cloud_service).toBe("iam");
    expect(result.cloud_account_id).toBe("123456789");
    expect(result._tags).toContain("iam");
  });

  test("should detect audit tampering", () => {
    const data = {
      source: "aws",
      event_type: "StopLogging",
      cloud: { service: "cloudtrail" },
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result.severity).toBe(9);
    expect(result._tags).toContain("audit-tampering");
  });
});

describe("M365Normalizer", () => {
  const normalizer = new M365Normalizer();

  test("should normalize login event", () => {
    const data = {
      source: "m365",
      event_type: "UserLoggedIn",
      user: "bob@demo.local",
      ip: "198.51.100.23",
      status: "Success",
      workload: "Exchange",
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result.action).toBe("login");
    expect(result.user).toBe("bob@demo.local");
    expect(result._tags).toContain("auth-success");
    expect(result._tags).toContain("workload:exchange");
  });

  test("should detect anonymous sharing", () => {
    const data = {
      source: "m365",
      event_type: "SharingSet",
      sharing_type: "AnonymousLink",
      status: "Success",
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result._tags).toContain("anonymous-sharing");
    expect(result._tags).toContain("data-exposure-risk");
    expect(result.severity).toBeGreaterThanOrEqual(6);
  });
});

describe("AdNormalizer", () => {
  const normalizer = new AdNormalizer();

  test("should normalize logon success (4624)", () => {
    const data = {
      source: "ad",
      event_id: 4624,
      user: "demo\\alice",
      host: "DC01",
      ip: "192.168.1.50",
      logon_type: 10,
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result.action).toBe("login");
    expect(result._tags).toContain("eventid:4624");
    expect(result._tags).toContain("auth-success");
    expect(result._tags).toContain("rdp");
  });

  test("should normalize logon failure (4625)", () => {
    const data = {
      source: "ad",
      event_id: 4625,
      user: "demo\\eve",
      logon_type: 3,
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result.action).toBe("deny");
    expect(result._tags).toContain("auth-failure");
    expect(result._tags).toContain("network-auth-failure");
  });

  test("should detect admin group changes", () => {
    const data = {
      source: "ad",
      event_id: 4728,
      group_name: "Domain Admins",
    };
    const result = normalizer.normalize(data, "test-tenant");

    expect(result._tags).toContain("admin-group-change");
    expect(result.severity).toBeGreaterThanOrEqual(7);
  });
});

describe("Normalizer Detection", () => {
  test("should detect correct normalizer for firewall syslog", () => {
    const syslog = "<134>Aug 20 12:44:56 fw01 vendor=demo action=deny";
    const normalizer = detectNormalizer(syslog);
    expect(normalizer).toBeInstanceOf(FirewallNormalizer);
  });

  test("should detect correct normalizer for network syslog", () => {
    const syslog = "<190>Aug 20 13:01:02 r1 event=link-down";
    const normalizer = detectNormalizer(syslog);
    expect(normalizer).toBeInstanceOf(NetworkNormalizer);
  });

  test("should detect correct normalizer by source field", () => {
    const data = { source: "crowdstrike", event_type: "malware" };
    const normalizer = detectNormalizer(data);
    expect(normalizer).toBeInstanceOf(CrowdStrikeNormalizer);
  });

  test("normalize function should work end-to-end", () => {
    const data = {
      source: "api",
      event_type: "test",
      user: "test",
    };
    const result = normalize(data, "test-tenant");

    expect(result.tenant_id).toBe("test-tenant");
    expect(result.source).toBe("api");
    expect(result.raw).toBeDefined();
  });
});
