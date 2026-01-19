import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { Tenant } from "./tenant.model.js";
import { AlertRule } from "./alertRule.model.js";

export const Alert = sequelize.define(
  "Alert",
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

    rule_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: AlertRule,
        key: "id",
      },
    },

    rule_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    severity: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: { min: 0, max: 10 },
    },

    status: {
      type: DataTypes.ENUM("open", "acknowledged", "resolved", "closed"),
      defaultValue: "open",
    },

    // Summary of what triggered the alert
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
    },

    // Matched events count
    event_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    // Sample of matched event IDs
    event_ids: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },

    // Group key that triggered (e.g., IP address)
    group_key: {
      type: DataTypes.STRING,
    },

    // Additional context
    context: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },

    // Notification status
    notified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    notified_at: {
      type: DataTypes.DATE,
    },

    // Resolution
    resolved_at: {
      type: DataTypes.DATE,
    },

    resolved_by: {
      type: DataTypes.STRING,
    },

    resolution_notes: {
      type: DataTypes.TEXT,
    },

    triggered_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "alerts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["tenant_id"] },
      { fields: ["rule_id"] },
      { fields: ["status"] },
      { fields: ["severity"] },
      { fields: ["triggered_at"] },
      { fields: ["tenant_id", "status"] },
      { fields: ["tenant_id", "triggered_at"] },
    ],
  }
);
