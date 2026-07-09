const Joi = require('joi');
const { MESSAGE_TYPE_ARRAY } = require('../constants/messageType');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const createSchema = Joi.object({
  receiver: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Receiver must be a valid ObjectId',
      'string.empty': 'Receiver is required'
    }),
  content: Joi.string()
    .trim()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Content is required',
      'string.min': 'Content must not be empty',
      'string.max': 'Content must not exceed 2000 characters'
    }),
  application: Joi.string()
    .pattern(objectIdPattern)
    .optional()
    .messages({
      'string.pattern.base': 'Application must be a valid ObjectId'
    }),
  messageType: Joi.string()
    .valid(...MESSAGE_TYPE_ARRAY)
    .optional()
    .messages({
      'any.only': 'Message type must be one of: ' + MESSAGE_TYPE_ARRAY.join(', ')
    }),
  sender: Joi.any().forbidden().messages({
    'any.unknown': 'Sender is set automatically from the authenticated user'
  }),
  isRead: Joi.any().forbidden(),
  readAt: Joi.any().forbidden(),
  isDeleted: Joi.any().forbidden(),
  deletedAt: Joi.any().forbidden(),
  createdAt: Joi.any().forbidden(),
  updatedAt: Joi.any().forbidden()
});

const validateCreateMessage = (data) => createSchema.validate(data, { abortEarly: false, stripUnknown: true });

module.exports = { validateCreateMessage };
