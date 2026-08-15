const Joi = require('joi');

const reportQuerySchema = Joi.object({
  from: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'from must be a valid date',
      'date.isoDate': 'from must be a valid ISO date (e.g. 2026-08-01)'
    }),
  to: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'to must be a valid date',
      'date.isoDate': 'to must be a valid ISO date (e.g. 2026-08-13)'
    }),
  format: Joi.string()
    .valid('csv', 'json')
    .optional()
    .messages({
      'any.only': 'format must be either csv or json'
    })
})
  .custom((value, helpers) => {
    if (value.from && value.to && value.to < value.from) {
      return helpers.error('date.range');
    }
    return value;
  }, 'from-to order')
  .messages({ 'date.range': 'to must not be earlier than from' });

const validateReportQuery = (data) => reportQuerySchema.validate(data, { abortEarly: false });

module.exports = { validateReportQuery, reportQuerySchema };
