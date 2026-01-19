import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { Tenant } from "./tenant.model.js";

export const AlertRule = sequelize.define(
  "AlertRule",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Tenant,
        key: "name",
      },
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
    },

    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // Rule type: threshold, pattern, sequence
    rule_type: {
      type: DataTypes.ENUM("threshold", "pattern", "sequence"),
      allowNull: false,
      defaultValue: "threshold",
    },

    // Conditions as JSON
    conditions: {
      type: DataTypes.JSONB,
      allowNull: false,
      // Example: { field: "action", operator: "eq", value: "deny" }
      // Example: { field: "severity", operator: "gte", value: 7 }
    },

    // Threshold settings
    threshold_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    threshold_window_seconds: {
      type: DataTypes.INTEGER,
      defaultValue: 300, // 5 minutes
    },

    // Group by fields for aggregation (e.g., ["src_ip", "user"])
    group_by: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },

    // Alert severity
    alert_severity: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: { min: 0, max: 10 },
    },

    // Notification settings
    notify_discord: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    discord_webhook_url: {
      type: DataTypes.STRING,
    },

    // Cooldown to prevent alert fatigue (seconds)
    cooldown_seconds: {
      type: DataTypes.INTEGER,
      defaultValue: 300, // 5 minutes
    },

    last_triggered_at: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "alert_rules",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["tenant_id"] },
      { fields: ["enabled"] },
      { fields: ["tenant_id", "enabled"] },
    ],
  }
);
