import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { Tenant } from "./tenant.model.js";

export const Event = sequelize.define(
  "Event",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    event_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Tenant,
        key: "name",
      },
    },

    source: {
      type: DataTypes.ENUM(
        "firewall",
        "crowdstrike",
        "aws",
        "m365",
        "ad",
        "api",
        "network"
      ),
      allowNull: false,
    },

    vendor: DataTypes.STRING,
    product: DataTypes.STRING,

    event_type: DataTypes.STRING,
    event_subtype: DataTypes.STRING,

    severity: {
      type: DataTypes.INTEGER,
      validate: { min: 0, max: 10 },
    },

    action: {
      type: DataTypes.ENUM(
        "allow",
        "deny",
        "create",
        "delete",
        "login",
        "logout",
        "alert"
      ),
    },

    src_ip: DataTypes.STRING,
    src_port: DataTypes.INTEGER,
    dst_ip: DataTypes.STRING,
    dst_port: DataTypes.INTEGER,
    protocol: DataTypes.STRING,

    user: DataTypes.STRING,
    host: DataTypes.STRING,
    process: DataTypes.STRING,

    url: DataTypes.TEXT,
    http_method: DataTypes.STRING,
    status_code: DataTypes.INTEGER,

    rule_name: DataTypes.STRING,
    rule_id: DataTypes.STRING,

    cloud_account_id: DataTypes.STRING,
    cloud_region: DataTypes.STRING,
    cloud_service: DataTypes.STRING,

    // Enrichment: DNS
    src_hostname: DataTypes.STRING,
    dst_hostname: DataTypes.STRING,

    // Enrichment: GeoIP
    src_geo_country: DataTypes.STRING,
    src_geo_city: DataTypes.STRING,
    src_geo_latitude: DataTypes.FLOAT,
    src_geo_longitude: DataTypes.FLOAT,
    dst_geo_country: DataTypes.STRING,
    dst_geo_city: DataTypes.STRING,
    dst_geo_latitude: DataTypes.FLOAT,
    dst_geo_longitude: DataTypes.FLOAT,

    raw: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    _tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
  },
  {
    tableName: "events",
    timestamps: false,
    indexes: [
      { fields: ["tenant_id"] },
      { fields: ["event_time"] },
      { fields: ["tenant_id", "event_time"] },
      { fields: ["source"] },
      { fields: ["severity"] },
      { fields: ["src_ip"] },
      { fields: ["dst_ip"] },
      {
        fields: ["_tags"],
        using: "gin",
      },
    ],
  }
);
