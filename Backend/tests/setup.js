// Test setup and utilities
import { beforeAll, afterAll } from "bun:test";

// Set test environment
process.env.NODE_ENV = "test";
process.env.DATABASE = "cyber_test";
process.env.DB_USER = "postgres";
process.env.DB_PASSWORD = "postgres";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.JWT_SECRET = "test-secret-key-at-least-32-characters-long";
process.env.JWT_EXPIRES_IN = "1h";
process.env.ENRICHMENT_ENABLED = "false";
process.env.RETENTION_ENABLED = "false";
process.env.SYSLOG_ENABLED = "false";

// Mock logger to reduce noise in tests
export const mockLogger = {
  info: () => {},
  debug: () => {},
  warn: () => {},
  error: () => {},
};

// Test utilities
export function createMockEvent(overrides = {}) {
  return {
    tenant_id: "test-tenant",
    source: "api",
    event_time: new Date().toISOString(),
    event_type: "test_event",
    severity: 5,
    action: "allow",
    src_ip: "192.168.1.100",
    dst_ip: "10.0.0.1",
    user: "testuser",
    host: "testhost",
    raw: JSON.stringify({ test: true }),
    _tags: ["test"],
    ...overrides,
  };
}

export function createMockUser(overrides = {}) {
  return {
    email: "test@example.com",
    password: "password123",
    role: "admin",
    tenant_id: "test-tenant",
    ...overrides,
  };
}

// Generate JWT token for testing
export async function generateTestToken(user) {
  const jwt = await import("jsonwebtoken");
  const payload = {
    sub: user.id || "test-user-id",
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id,
  };
  return jwt.default.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}
