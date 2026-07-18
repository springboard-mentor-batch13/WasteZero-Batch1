const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const markAsReadSchema = Joi.object({
  id: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Notification ID must be a valid ObjectId',
      'string.empty': 'Notification ID is required'
    })
});

const markAllReadSchema = Joi.object().max(0);

const deleteNotificationSchema = Joi.object({
  id: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'Notification ID must be a valid ObjectId',
      'string.empty': 'Notification ID is required'
    })
});

const validateMarkAsRead = (data) => markAsReadSchema.validate(data, { abortEarly: false, stripUnknown: true });
const validateMarkAllRead = (data) => markAllReadSchema.validate(data, { abortEarly: false, stripUnknown: true });
const validateDeleteNotification = (data) => deleteNotificationSchema.validate(data, { abortEarly: false, stripUnknown: true });

module.exports = { validateMarkAsRead, validateMarkAllRead, validateDeleteNotification };
