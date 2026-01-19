import { describe, test, expect, beforeAll, mock } from "bun:test";
import "../setup.js";

// Mock the database
mock.module("../../src/config/database.js", () => ({
  sequelize: {
    define: () => ({}),
    authenticate: async () => {},
    sync: async () => {},
  },
}));

describe("Auth Service", () => {
  test("should generate valid JWT token structure", async () => {
    const jwt = await import("jsonwebtoken");
    const secret = process.env.JWT_SECRET;

    const payload = {
      sub: "user-123",
      email: "test@example.com",
      role: "admin",
      tenant_id: "tenant-123",
    };

    const token = jwt.default.sign(payload, secret, { expiresIn: "1h" });
    const decoded = jwt.default.verify(token, secret);

    expect(decoded.sub).toBe("user-123");
    expect(decoded.email).toBe("test@example.com");
    expect(decoded.role).toBe("admin");
    expect(decoded.tenant_id).toBe("tenant-123");
  });

  test("should reject expired tokens", async () => {
    const jwt = await import("jsonwebtoken");
    const secret = process.env.JWT_SECRET;

    const token = jwt.default.sign({ sub: "user" }, secret, { expiresIn: "-1h" });

    expect(() => jwt.default.verify(token, secret)).toThrow();
  });

  test("should reject tokens with invalid signature", async () => {
    const jwt = await import("jsonwebtoken");

    const token = jwt.default.sign({ sub: "user" }, "wrong-secret", { expiresIn: "1h" });

    expect(() => jwt.default.verify(token, process.env.JWT_SECRET)).toThrow();
  });
});

describe("Password Hashing", () => {
  test("should hash password correctly", async () => {
    const bcrypt = await import("bcrypt");
    const password = "testpassword123";

    const hash = await bcrypt.default.hash(password, 12);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });

  test("should verify correct password", async () => {
    const bcrypt = await import("bcrypt");
    const password = "testpassword123";
    const hash = await bcrypt.default.hash(password, 12);

    const isValid = await bcrypt.default.compare(password, hash);

    expect(isValid).toBe(true);
  });

  test("should reject incorrect password", async () => {
    const bcrypt = await import("bcrypt");
    const password = "testpassword123";
    const hash = await bcrypt.default.hash(password, 12);

    const isValid = await bcrypt.default.compare("wrongpassword", hash);

    expect(isValid).toBe(false);
  });
});
