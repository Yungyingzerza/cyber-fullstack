import { verifyToken } from "../services/auth.service.js";
import { User, Tenant } from "../models/index.js";

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyToken(token);

    // Verify user still exists in database
    const user = await User.findByPk(decoded.sub);
    if (!user) {
      return res.status(401).json({
        error: "Invalid token",
        message: "User no longer exists",
      });
    }

    // Verify tenant is still active
    const tenant = await Tenant.findOne({
      where: { name: user.tenant_id, is_active: true },
    });
    if (!tenant) {
      return res.status(401).json({
        error: "Invalid token",
        message: "Tenant is inactive or no longer exists",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        message: "Please log in again",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
        message: "Authentication failed",
      });
    }
    return res.status(401).json({
      error: "Invalid token",
      message: "Authentication failed",
    });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `This action requires one of the following roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
}

export function tenantIsolation(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  req.tenantFilter = { tenant_id: req.user.tenant_id };

  const originalQuery = req.query;
  if (originalQuery.tenant_id && originalQuery.tenant_id !== req.user.tenant_id) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Cannot access data from another tenant",
    });
  }

  next();
}
