const Joi = require('joi');

const schemas = {
    register: Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        currency: Joi.string().length(3).uppercase().optional()
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),
    bill: Joi.object({
        name: Joi.string().required(),
        amount: Joi.number().min(0).required(),
        due_date: Joi.date().iso().required(),
        category: Joi.string().optional(),
        recurrence: Joi.string().valid('one-time', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly').optional(),
        notes: Joi.string().allow('', null).optional(),
        client: Joi.string().allow('', null).optional()
    })
};

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const details = error.details.map(d => d.message).join(', ');
            return res.status(400).json({ error: `VALIDATION_ERROR: ${details}` });
        }
        next();
    };
};

module.exports = { schemas, validateRequest };
