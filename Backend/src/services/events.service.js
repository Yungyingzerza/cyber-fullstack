import { Op, literal } from "sequelize";
import { Event, sequelize } from "../models/index.js";

export async function queryEvents(filters, options = {}) {
  const {
    tenant_id,
    source,
    sources,
    severity_min,
    severity_max,
    severity,
    action,
    actions,
    start_time,
    end_time,
    src_ip,
    dst_ip,
    user,
    host,
    tags,
    search,
    event_type,
  } = filters;

  const {
    page = 1,
    limit = 50,
    sort_by = "event_time",
    sort_order = "DESC",
  } = options;

  const where = {};

  // Tenant isolation (required)
  if (tenant_id) {
    where.tenant_id = tenant_id;
  }

  // Source filter
  if (source) {
    where.source = source;
  } else if (sources && sources.length > 0) {
    where.source = { [Op.in]: sources };
  }

  // Severity filter
  if (severity !== undefined) {
    where.severity = severity;
  } else {
    if (severity_min !== undefined) {
      where.severity = { ...where.severity, [Op.gte]: severity_min };
    }
    if (severity_max !== undefined) {
      where.severity = { ...where.severity, [Op.lte]: severity_max };
    }
  }

  // Action filter
  if (action) {
    where.action = action;
  } else if (actions && actions.length > 0) {
    where.action = { [Op.in]: actions };
  }

  // Time range filter
  if (start_time || end_time) {
    where.event_time = {};
    if (start_time) {
      where.event_time[Op.gte] = new Date(start_time);
    }
    if (end_time) {
      where.event_time[Op.lte] = new Date(end_time);
    }
  }

  // IP filters
  if (src_ip) {
    where.src_ip = { [Op.like]: src_ip.replace(/\*/g, "%") };
  }
  if (dst_ip) {
    where.dst_ip = { [Op.like]: dst_ip.replace(/\*/g, "%") };
  }

  // User filter
  if (user) {
    where.user = { [Op.iLike]: `%${user}%` };
  }

  // Host filter
  if (host) {
    where.host = { [Op.iLike]: `%${host}%` };
  }

  // Event type filter
  if (event_type) {
    where.event_type = { [Op.iLike]: `%${event_type}%` };
  }

  // Tag-based filtering (using GIN index with array contains)
  if (tags && tags.length > 0) {
    where._tags = { [Op.contains]: tags };
  }

  // Full-text search on raw field
  if (search) {
    where.raw = { [Op.iLike]: `%${search}%` };
  }

  // Validate sort column
  const validSortColumns = [
    "event_time", "severity", "source", "action",
    "src_ip", "dst_ip", "user", "host", "event_type"
  ];
  const sortColumn = validSortColumns.includes(sort_by) ? sort_by : "event_time";
  const order = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  // Calculate offset
  const offset = (page - 1) * limit;

  // Execute query with count
  const { count, rows } = await Event.findAndCountAll({
    where,
    order: [[sortColumn, order]],
    limit: Math.min(limit, 1000), // Cap at 1000
    offset,
  });

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
      has_next: page * limit < count,
      has_prev: page > 1,
    },
  };
}

export async function getEventById(id, tenantId) {
  const event = await Event.findOne({
    where: {
      id,
      tenant_id: tenantId,
    },
  });

  return event;
}

export async function getEventStats(tenantId, timeRange = {}) {
  const where = { tenant_id: tenantId };

  if (timeRange.start_time || timeRange.end_time) {
    where.event_time = {};
    if (timeRange.start_time) {
      where.event_time[Op.gte] = new Date(timeRange.start_time);
    }
    if (timeRange.end_time) {
      where.event_time[Op.lte] = new Date(timeRange.end_time);
    }
  }

  const [
    totalCount,
    sourceStats,
    severityStats,
    actionStats,
  ] = await Promise.all([
    Event.count({ where }),

    Event.findAll({
      where,
      attributes: [
        "source",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["source"],
      raw: true,
    }),

    Event.findAll({
      where,
      attributes: [
        "severity",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["severity"],
      order: [["severity", "DESC"]],
      raw: true,
    }),

    Event.findAll({
      where,
      attributes: [
        "action",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["action"],
      raw: true,
    }),
  ]);

  return {
    total: totalCount,
    by_source: sourceStats.reduce((acc, row) => {
      acc[row.source] = parseInt(row.count, 10);
      return acc;
    }, {}),
    by_severity: severityStats.reduce((acc, row) => {
      if (row.severity !== null) {
        acc[row.severity] = parseInt(row.count, 10);
      }
      return acc;
    }, {}),
    by_action: actionStats.reduce((acc, row) => {
      if (row.action) {
        acc[row.action] = parseInt(row.count, 10);
      }
      return acc;
    }, {}),
  };
}

export async function deleteEvent(id, tenantId) {
  const deleted = await Event.destroy({
    where: {
      id,
      tenant_id: tenantId,
    },
  });

  return deleted > 0;
}

export async function deleteEvents(filters, tenantId) {
  const where = { tenant_id: tenantId };

  if (filters.before) {
    where.event_time = { [Op.lt]: new Date(filters.before) };
  }

  if (filters.source) {
    where.source = filters.source;
  }

  const deleted = await Event.destroy({ where });
  return deleted;
}
