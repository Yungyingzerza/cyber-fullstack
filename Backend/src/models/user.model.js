import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import bcrypt from "bcrypt";
import { Tenant } from "./tenant.model.js";

const SALT_ROUNDS = 12;

export const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM("admin", "viewer"),
      allowNull: false,
      defaultValue: "viewer",
    },

    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Tenant,
        key: "name",
      },
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["email"], unique: true },
      { fields: ["tenant_id"] },
    ],
  }
);

// Define association
User.belongsTo(Tenant, { foreignKey: "tenant_id", targetKey: "name" });

User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

User.hashPassword = async function (password) {
  return bcrypt.hash(password, SALT_ROUNDS);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};
