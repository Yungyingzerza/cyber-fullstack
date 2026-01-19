import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { User } from "../models/index.js";
import { tenantExists } from "./tenant.service.js";

export async function register({ email, password, role, tenant_id }) {
  // Validate tenant exists
  const validTenant = await tenantExists(tenant_id);
  if (!validTenant) {
    const error = new Error("Invalid tenant_id. Tenant does not exist or is inactive.");
    error.status = 400;
    throw error;
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error("Email already registered");
    error.status = 409;
    throw error;
  }

  const password_hash = await User.hashPassword(password);

  const user = await User.create({
    email,
    password_hash,
    role: role || "viewer",
    tenant_id,
  });

  const token = generateToken(user);

  return { user, token };
}

export async function login({ email, password }) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const token = generateToken(user);

  return { user, token };
}

export function generateToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id,
  };

  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}
