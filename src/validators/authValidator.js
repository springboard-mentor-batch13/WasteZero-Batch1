const Joi = require('joi');
const { ROLES_ARRAY } = require('../constants/roles');

const passwordSchema = Joi.string().min(6).max(128).required().messages({
  'string.min': 'Password must be at least 6 characters',
  'string.max': 'Password must not exceed 128 characters',
  'string.empty': 'Password is required'
});

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must not exceed 50 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required'
  }),
  password: passwordSchema,
  role: Joi.string().valid(...ROLES_ARRAY).required().messages({
    'any.only': 'Role must be one of: ' + ROLES_ARRAY.join(', '),
    'string.empty': 'Role is required'
  }),
  skills: Joi.array().items(Joi.string().trim()).optional(),
  location: Joi.string().trim().allow('').optional(),
  bio: Joi.string().trim().max(500).allow('').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  }),
  rememberMe: Joi.boolean().optional()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required'
  })
});

const validateRegister = (data) => registerSchema.validate(data, { abortEarly: false });
const validateLogin = (data) => loginSchema.validate(data, { abortEarly: false });
const validateRefreshToken = (data) => refreshTokenSchema.validate(data, { abortEarly: false });

module.exports = { validateRegister, validateLogin, validateRefreshToken, passwordSchema };
