import Joi from "joi";

const sourceEnum = ["firewall", "crowdstrike", "aws", "m365", "ad", "api", "network"];
const actionEnum = ["allow", "deny", "create", "delete", "login", "logout", "alert"];

export const querySchema = Joi.object({
  // Filters
  source: Joi.string().valid(...sourceEnum),
  sources: Joi.alternatives().try(
    Joi.array().items(Joi.string().valid(...sourceEnum)),
    Joi.string().valid(...sourceEnum)
  ),
  severity: Joi.number().integer().min(0).max(10),
  severity_min: Joi.number().integer().min(0).max(10),
  severity_max: Joi.number().integer().min(0).max(10),
  action: Joi.string().valid(...actionEnum),
  actions: Joi.alternatives().try(
    Joi.array().items(Joi.string().valid(...actionEnum)),
    Joi.string().valid(...actionEnum)
  ),
  start_time: Joi.string().isoDate(),
  end_time: Joi.string().isoDate(),
  src_ip: Joi.string().max(50),
  dst_ip: Joi.string().max(50),
  user: Joi.string().max(100),
  host: Joi.string().max(100),
  event_type: Joi.string().max(100),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().max(50)),
    Joi.string().max(50)
  ),
  search: Joi.string().max(500),

  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(1000).default(50),

  // Sorting
  sort_by: Joi.string().valid(
    "event_time", "severity", "source", "action",
    "src_ip", "dst_ip", "user", "host", "event_type"
  ).default("event_time"),
  sort_order: Joi.string().valid("asc", "desc", "ASC", "DESC").default("DESC"),
});

export const statsSchema = Joi.object({
  start_time: Joi.string().isoDate(),
  end_time: Joi.string().isoDate(),
});

export const deleteSchema = Joi.object({
  before: Joi.string().isoDate().required(),
  source: Joi.string().valid(...sourceEnum),
});

export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({
        error: "Validation failed",
        details: messages,
      });
    }

    // Normalize array fields that might come as single values
    if (value.sources && !Array.isArray(value.sources)) {
      value.sources = [value.sources];
    }
    if (value.actions && !Array.isArray(value.actions)) {
      value.actions = [value.actions];
    }
    if (value.tags && !Array.isArray(value.tags)) {
      value.tags = [value.tags];
    }

    // Express 5: req.query is read-only, use req.validatedQuery instead
    req.validatedQuery = value;
    next();
  };
}

export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({
        error: "Validation failed",
        details: messages,
      });
    }

    req.body = value;
    next();
  };
}
