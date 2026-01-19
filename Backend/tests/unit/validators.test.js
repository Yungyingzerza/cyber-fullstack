import { describe, test, expect } from "bun:test";
import { registerSchema, loginSchema } from "../../src/validators/auth.validator.js";
import { singleEventSchema, batchEventSchema } from "../../src/validators/ingest.validator.js";
import { querySchema } from "../../src/validators/events.validator.js";
import { createRuleSchema } from "../../src/validators/alerts.validator.js";
import { policySchema } from "../../src/validators/retention.validator.js";

describe("Auth Validators", () => {
  describe("registerSchema", () => {
    test("should accept valid registration data", () => {
      const data = {
        email: "test@example.com",
        password: "password123",
        role: "admin",
        tenant_id: "tenant-123",
      };
      const { error } = registerSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should reject invalid email", () => {
      const data = {
        email: "not-an-email",
        password: "password123",
        tenant_id: "tenant-123",
      };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
    });

    test("should reject short password", () => {
      const data = {
        email: "test@example.com",
        password: "short",
        tenant_id: "tenant-123",
      };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
    });

    test("should reject missing tenant_id", () => {
      const data = {
        email: "test@example.com",
        password: "password123",
      };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
    });

    test("should reject invalid role", () => {
      const data = {
        email: "test@example.com",
        password: "password123",
        role: "superadmin",
        tenant_id: "tenant-123",
      };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe("loginSchema", () => {
    test("should accept valid login data", () => {
      const data = {
        email: "test@example.com",
        password: "password123",
      };
      const { error } = loginSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should reject missing password", () => {
      const data = {
        email: "test@example.com",
      };
      const { error } = loginSchema.validate(data);
      expect(error).toBeDefined();
    });
  });
});

describe("Ingest Validators", () => {
  describe("singleEventSchema", () => {
    test("should accept valid event", () => {
      const data = {
        source: "api",
        event_type: "test",
        "@timestamp": "2025-08-20T10:00:00Z",
      };
      const { error } = singleEventSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should reject invalid source", () => {
      const data = {
        source: "invalid_source",
        event_type: "test",
      };
      const { error } = singleEventSchema.validate(data);
      expect(error).toBeDefined();
    });

    test("should accept all valid sources", () => {
      const sources = ["firewall", "crowdstrike", "aws", "m365", "ad", "api", "network"];
      for (const source of sources) {
        const { error } = singleEventSchema.validate({ source });
        expect(error).toBeUndefined();
      }
    });

    test("should validate severity range", () => {
      const valid = { source: "api", severity: 5 };
      const tooHigh = { source: "api", severity: 11 };
      const tooLow = { source: "api", severity: -1 };

      expect(singleEventSchema.validate(valid).error).toBeUndefined();
      expect(singleEventSchema.validate(tooHigh).error).toBeDefined();
      expect(singleEventSchema.validate(tooLow).error).toBeDefined();
    });
  });

  describe("batchEventSchema", () => {
    test("should accept array of events", () => {
      const data = [
        { source: "api", event_type: "test1" },
        { source: "firewall", event_type: "test2" },
      ];
      const { error } = batchEventSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should reject empty array", () => {
      const { error } = batchEventSchema.validate([]);
      expect(error).toBeDefined();
    });

    test("should reject array with more than 1000 items", () => {
      const data = Array(1001).fill({ source: "api" });
      const { error } = batchEventSchema.validate(data);
      expect(error).toBeDefined();
    });
  });
});

describe("Events Query Validators", () => {
  describe("querySchema", () => {
    test("should accept valid query params", () => {
      const data = {
        source: "firewall",
        severity_min: 5,
        page: 1,
        limit: 50,
      };
      const { error } = querySchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should set defaults", () => {
      const { value } = querySchema.validate({});
      expect(value.page).toBe(1);
      expect(value.limit).toBe(50);
      expect(value.sort_by).toBe("event_time");
      expect(value.sort_order).toBe("DESC");
    });

    test("should reject invalid sort_by", () => {
      const { error } = querySchema.validate({ sort_by: "invalid_field" });
      expect(error).toBeDefined();
    });

    test("should accept valid sort_order values", () => {
      expect(querySchema.validate({ sort_order: "asc" }).error).toBeUndefined();
      expect(querySchema.validate({ sort_order: "DESC" }).error).toBeUndefined();
    });

    test("should cap limit at 1000", () => {
      const { error } = querySchema.validate({ limit: 1001 });
      expect(error).toBeDefined();
    });
  });
});

describe("Alert Validators", () => {
  describe("createRuleSchema", () => {
    test("should accept valid rule", () => {
      const data = {
        name: "Test Rule",
        conditions: { field: "action", operator: "eq", value: "deny" },
        threshold_count: 5,
        threshold_window_seconds: 300,
      };
      const { error } = createRuleSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should accept array of conditions", () => {
      const data = {
        name: "Test Rule",
        conditions: [
          { field: "action", operator: "eq", value: "deny" },
          { field: "severity", operator: "gte", value: 5 },
        ],
      };
      const { error } = createRuleSchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should reject invalid operator", () => {
      const data = {
        name: "Test Rule",
        conditions: { field: "action", operator: "invalid", value: "deny" },
      };
      const { error } = createRuleSchema.validate(data);
      expect(error).toBeDefined();
    });

    test("should accept all valid operators", () => {
      const operators = ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in", "regex", "exists", "not_exists"];
      for (const operator of operators) {
        const data = {
          name: "Test",
          conditions: { field: "test", operator, value: "test" },
        };
        const { error } = createRuleSchema.validate(data);
        expect(error).toBeUndefined();
      }
    });
  });
});

describe("Retention Validators", () => {
  describe("policySchema", () => {
    test("should accept valid policy", () => {
      const data = {
        retention_days: 30,
        source_overrides: { firewall: 14 },
        severity_overrides: { "9": 180 },
      };
      const { error } = policySchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should reject retention_days below minimum", () => {
      const data = { retention_days: 5 };
      const { error } = policySchema.validate(data);
      expect(error).toBeDefined();
    });

    test("should accept minimum retention_days of 7", () => {
      const data = { retention_days: 7 };
      const { error } = policySchema.validate(data);
      expect(error).toBeUndefined();
    });

    test("should validate source_overrides keys", () => {
      const valid = { source_overrides: { firewall: 14, crowdstrike: 30 } };
      const invalid = { source_overrides: { invalid_source: 14 } };

      expect(policySchema.validate(valid).error).toBeUndefined();
      expect(policySchema.validate(invalid).error).toBeDefined();
    });
  });
});
