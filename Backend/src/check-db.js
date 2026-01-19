import { sequelize, connect } from "./config/database.js";

async function checkDb() {
  try {
    await connect();

    // Check tables
    const [tables] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
    );
    console.log("Tables:", tables.map(t => t.tablename));

    // Check tenants
    const [tenants] = await sequelize.query('SELECT id, name FROM tenants LIMIT 5;');
    console.log("Tenants:", tenants);

    // Check users
    const [users] = await sequelize.query('SELECT id, email, role, tenant_id FROM users LIMIT 5;');
    console.log("Users:", users);

    // Check foreign key constraints
    const [fks] = await sequelize.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'users';
    `);
    console.log("Users FK constraints:", fks);

    await sequelize.close();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkDb();
