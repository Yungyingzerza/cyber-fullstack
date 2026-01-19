import { sequelize } from "../config/database.js";
import { Tenant } from "./tenant.model.js";
import { User } from "./user.model.js";
import { Event } from "./event.model.js";
import { AlertRule } from "./alertRule.model.js";
import { Alert } from "./alert.model.js";
import { RetentionPolicy } from "./retentionPolicy.model.js";

// Tenant -> User (one-to-many)
// User.belongsTo is already defined in user.model.js
Tenant.hasMany(User, { foreignKey: "tenant_id", sourceKey: "name" });

// Tenant -> Event (one-to-many)
Tenant.hasMany(Event, { foreignKey: "tenant_id", sourceKey: "name" });
Event.belongsTo(Tenant, { foreignKey: "tenant_id", targetKey: "name" });

// Tenant -> AlertRule (one-to-many)
Tenant.hasMany(AlertRule, { foreignKey: "tenant_id", sourceKey: "name" });
AlertRule.belongsTo(Tenant, { foreignKey: "tenant_id", targetKey: "name" });

// Tenant -> Alert (one-to-many)
Tenant.hasMany(Alert, { foreignKey: "tenant_id", sourceKey: "name" });
Alert.belongsTo(Tenant, { foreignKey: "tenant_id", targetKey: "name" });

// Tenant -> RetentionPolicy (one-to-one)
Tenant.hasOne(RetentionPolicy, { foreignKey: "tenant_id", sourceKey: "name" });
RetentionPolicy.belongsTo(Tenant, { foreignKey: "tenant_id", targetKey: "name" });

// AlertRule -> Alert (one-to-many)
AlertRule.hasMany(Alert, { foreignKey: "rule_id" });
Alert.belongsTo(AlertRule, { foreignKey: "rule_id" });

export { sequelize, Tenant, User, Event, AlertRule, Alert, RetentionPolicy };
