import { connect, sync } from "./config/database.js";
import { sequelize, Tenant, User, AlertRule } from "./models/index.js";
import { createDefaultRules } from "./services/alerting.service.js";

async function seed() {
  try {
    await connect();
    await sync();

    // Create tenants
    const tenants = [
      { name: "acme", description: "Acme Corporation" },
      { name: "globex", description: "Globex Industries" },
    ];

    for (const tenantData of tenants) {
      let tenant = await Tenant.findOne({ where: { name: tenantData.name } });
      if (!tenant) {
        tenant = await Tenant.create({
          name: tenantData.name,
          description: tenantData.description,
          is_active: true,
        });
        console.log("Tenant created:", tenant.name);
      } else {
        console.log("Tenant found:", tenant.name);
      }

      // Create admin user for tenant
      const adminEmail = `admin@${tenantData.name}.com`;
      let admin = await User.findOne({ where: { email: adminEmail } });
      if (!admin) {
        const password_hash = await User.hashPassword("admin123");
        admin = await User.create({
          email: adminEmail,
          password_hash,
          role: "admin",
          tenant_id: tenant.name,
        });
        console.log("  Admin created:", admin.email);
      } else {
        console.log("  Admin found:", admin.email);
      }

      // Create viewer user for tenant
      const viewerEmail = `viewer@${tenantData.name}.com`;
      let viewer = await User.findOne({ where: { email: viewerEmail } });
      if (!viewer) {
        const viewerHash = await User.hashPassword("viewer123");
        viewer = await User.create({
          email: viewerEmail,
          password_hash: viewerHash,
          role: "viewer",
          tenant_id: tenant.name,
        });
        console.log("  Viewer created:", viewer.email);
      } else {
        console.log("  Viewer found:", viewer.email);
      }

      // Delete existing alert rules and recreate
      await AlertRule.destroy({ where: { tenant_id: tenant.name } });
      const rules = await createDefaultRules(tenant.name);
      console.log("  Alert rule created:", rules.map(r => r.name).join(", "));
    }

    console.log("\n=== Seed complete ===");
    console.log("\nTenant: acme");
    console.log("  Admin:  admin@acme.com / admin123");
    console.log("  Viewer: viewer@acme.com / viewer123");
    console.log("\nTenant: globex");
    console.log("  Admin:  admin@globex.com / admin123");
    console.log("  Viewer: viewer@globex.com / viewer123");

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
