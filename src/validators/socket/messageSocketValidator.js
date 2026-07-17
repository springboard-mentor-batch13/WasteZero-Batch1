const Joi = require('joi');
const mongoose = require('mongoose');

const sendMessageSchema = Joi.object({
  receiver: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .required()
    .messages({
      'any.invalid': 'Invalid receiver ID',
      'any.required': 'Receiver is required',
      'string.empty': 'Receiver is required'
    }),
  content: Joi.string()
    .trim()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Content must not be empty',
      'string.max': 'Content must not exceed 2000 characters',
      'string.empty': 'Content must not be empty',
      'any.required': 'Content is required'
    })
});

module.exports = { sendMessageSchema };
