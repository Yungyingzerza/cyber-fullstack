import Joi from "joi";

const sourceEnum = ["firewall", "crowdstrike", "aws", "m365", "ad", "api", "network"];

export const policySchema = Joi.object({
  retention_days: Joi.number().integer().min(7).max(3650).default(30),
  archive_enabled: Joi.boolean().default(false),
  archive_destination: Joi.string().max(500).allow("", null),
  source_overrides: Joi.object().pattern(
    Joi.string().valid(...sourceEnum),
    Joi.number().integer().min(7).max(3650)
  ).default({}),
  severity_overrides: Joi.object().pattern(
    Joi.string().pattern(/^([0-9]|10)$/),
    Joi.number().integer().min(7).max(3650)
  ).default({}),
  enabled: Joi.boolean().default(true),
});

export const updatePolicySchema = Joi.object({
  retention_days: Joi.number().integer().min(7).max(3650),
  archive_enabled: Joi.boolean(),
  archive_destination: Joi.string().max(500).allow("", null),
  source_overrides: Joi.object().pattern(
    Joi.string().valid(...sourceEnum),
    Joi.number().integer().min(7).max(3650)
  ),
  severity_overrides: Joi.object().pattern(
    Joi.string().pattern(/^([0-9]|10)$/),
    Joi.number().integer().min(7).max(3650)
  ),
  enabled: Joi.boolean(),
}).min(1);

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
