import Joi from "joi";

const conditionSchema = Joi.object({
  field: Joi.string().required(),
  operator: Joi.string()
    .valid("eq", "neq", "gt", "gte", "lt", "lte", "contains", "in", "regex", "exists", "not_exists")
    .required(),
  value: Joi.any(),
});

export const createRuleSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500),
  enabled: Joi.boolean().default(true),
  rule_type: Joi.string().valid("threshold", "pattern", "sequence").default("threshold"),
  conditions: Joi.alternatives()
    .try(conditionSchema, Joi.array().items(conditionSchema))
    .required(),
  threshold_count: Joi.number().integer().min(1).max(1000).default(1),
  threshold_window_seconds: Joi.number().integer().min(60).max(86400).default(300),
  group_by: Joi.array().items(Joi.string()).default([]),
  alert_severity: Joi.number().integer().min(0).max(10).default(5),
  notify_discord: Joi.boolean().default(false),
  discord_webhook_url: Joi.string().uri().allow("", null),
  cooldown_seconds: Joi.number().integer().min(0).max(86400).default(300),
});

export const updateRuleSchema = Joi.object({
  name: Joi.string().max(100),
  description: Joi.string().max(500),
  enabled: Joi.boolean(),
  rule_type: Joi.string().valid("threshold", "pattern", "sequence"),
  conditions: Joi.alternatives().try(conditionSchema, Joi.array().items(conditionSchema)),
  threshold_count: Joi.number().integer().min(1).max(1000),
  threshold_window_seconds: Joi.number().integer().min(60).max(86400),
  group_by: Joi.array().items(Joi.string()),
  alert_severity: Joi.number().integer().min(0).max(10),
  notify_discord: Joi.boolean(),
  discord_webhook_url: Joi.string().uri().allow("", null),
  cooldown_seconds: Joi.number().integer().min(0).max(86400),
}).min(1);

export const updateAlertStatusSchema = Joi.object({
  status: Joi.string().valid("open", "acknowledged", "resolved", "closed").required(),
  notes: Joi.string().max(1000),
});

export const alertQuerySchema = Joi.object({
  status: Joi.string().valid("open", "acknowledged", "resolved", "closed"),
  severity_min: Joi.number().integer().min(0).max(10),
  rule_id: Joi.string().uuid(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

export function validate(schema) {
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

    req.validatedQuery = value;
    next();
  };
}
