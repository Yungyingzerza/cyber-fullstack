import Joi from "joi";

const sourceEnum = ["firewall", "crowdstrike", "aws", "m365", "ad", "api", "network"];

// Permissive event schema - allows any additional fields
const eventSchema = Joi.object({
  source: Joi.string().valid(...sourceEnum).required(),
  severity: Joi.number().integer().min(0).max(10),
}).unknown(true);

export const singleEventSchema = eventSchema;

export const batchEventSchema = Joi.array().items(eventSchema).min(1).max(1000);

export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: false,
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
