import Joi from "joi";

export const createTenantSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow("", null),
  is_active: Joi.boolean().default(true),
});

export const updateTenantSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(500).allow("", null),
  is_active: Joi.boolean(),
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
