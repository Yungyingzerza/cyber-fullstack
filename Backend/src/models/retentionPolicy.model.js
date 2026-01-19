import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { Tenant } from "./tenant.model.js";

export const RetentionPolicy = sequelize.define(
  "RetentionPolicy",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      references: {
        model: Tenant,
        key: "name",
      },
    },

    // Retention period in days (minimum 7)
    retention_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      validate: {
        min: 7,
      },
    },

    // Whether to archive before deletion
    archive_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // Archive destination (s3, local, etc.)
    archive_destination: {
      type: DataTypes.STRING,
    },

    // Source-specific retention overrides
    source_overrides: {
      type: DataTypes.JSONB,
      defaultValue: {},
      // Example: { "firewall": 14, "crowdstrike": 90 }
    },

    // Severity-based retention (keep high severity longer)
    severity_overrides: {
      type: DataTypes.JSONB,
      defaultValue: {},
      // Example: { "7": 60, "8": 90, "9": 180, "10": 365 }
    },

    // Last cleanup run
    last_cleanup_at: {
      type: DataTypes.DATE,
    },

    // Events deleted in last cleanup
    last_cleanup_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    // Policy enabled
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "retention_policies",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["tenant_id"], unique: true },
      { fields: ["enabled"] },
    ],
  }
);
