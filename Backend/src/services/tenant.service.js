import { Tenant, User, RetentionPolicy } from "../models/index.js";

export async function createTenant(data) {
  const existing = await Tenant.findOne({ where: { name: data.name } });
  if (existing) {
    const error = new Error("Tenant with this name already exists");
    error.status = 409;
    throw error;
  }

  return Tenant.create(data);
}

export async function getAllTenants({ includeInactive = false, includeUsers = false } = {}) {
  const where = includeInactive ? {} : { is_active: true };
  const options = {
    where,
    order: [["created_at", "DESC"]],
  };

  if (includeUsers) {
    options.include = [
      {
        model: User,
        attributes: ["id", "email", "role", "created_at"],
      },
    ];
  }

  return Tenant.findAll(options);
}

export async function getTenantById(id, { includeUsers = false, includePolicy = false } = {}) {
  const include = [];

  if (includeUsers) {
    include.push({
      model: User,
      attributes: ["id", "email", "role", "created_at"],
    });
  }

  if (includePolicy) {
    include.push({
      model: RetentionPolicy,
    });
  }

  const tenant = await Tenant.findByPk(id, { include });
  if (!tenant) {
    const error = new Error("Tenant not found");
    error.status = 404;
    throw error;
  }
  return tenant;
}

export async function getTenantByName(name, { includeUsers = false, includePolicy = false } = {}) {
  const include = [];

  if (includeUsers) {
    include.push({
      model: User,
      attributes: ["id", "email", "role", "created_at"],
    });
  }

  if (includePolicy) {
    include.push({
      model: RetentionPolicy,
    });
  }

  const tenant = await Tenant.findOne({ where: { name }, include });
  if (!tenant) {
    const error = new Error("Tenant not found");
    error.status = 404;
    throw error;
  }
  return tenant;
}

export async function updateTenant(id, data) {
  const tenant = await getTenantById(id);

  if (data.name && data.name !== tenant.name) {
    const existing = await Tenant.findOne({ where: { name: data.name } });
    if (existing) {
      const error = new Error("Tenant with this name already exists");
      error.status = 409;
      throw error;
    }
  }

  await tenant.update(data);
  return tenant;
}

export async function deleteTenant(id) {
  const tenant = await getTenantById(id);
  await tenant.destroy();
  return { message: "Tenant deleted successfully" };
}

export async function tenantExists(name) {
  const tenant = await Tenant.findOne({ where: { name, is_active: true } });
  return !!tenant;
}
