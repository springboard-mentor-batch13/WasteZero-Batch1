const Joi = require('joi');
const { OPPORTUNITY_STATUS_ARRAY } = require('../constants/opportunityStatus');
const { DURATION_UNITS_ARRAY } = require('../constants/durationUnits');

const titleRegex = /^[a-zA-Z0-9\s\-&']+$/;

const createSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(titleRegex, 'letters, numbers, spaces, -, &, \'')
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title must not exceed 100 characters',
      'string.pattern.name': 'Title can only contain letters, numbers, spaces, -, &, and \''
    }),
  description: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .custom((value) => value.replace(/\s{2,}/g, ' '))
    .required()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must not exceed 2000 characters'
    }),
  requiredSkills: Joi.array()
    .items(
      Joi.string().trim().custom((val) => val.toLowerCase()).required()
    )
    .max(20)
    .unique()
    .optional()
    .messages({
      'array.max': 'Maximum 20 skills allowed',
      'array.unique': 'Duplicate skills are not allowed'
    }),
  location: Joi.object({
    city: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .custom((val) => val.replace(/\b\w/g, (c) => c.toUpperCase()))
      .required()
      .messages({
        'string.empty': 'City is required',
        'string.min': 'City must be at least 2 characters',
        'string.max': 'City must not exceed 50 characters'
      }),
    state: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .custom((val) => val.replace(/\b\w/g, (c) => c.toUpperCase()))
      .required()
      .messages({
        'string.empty': 'State is required',
        'string.min': 'State must be at least 2 characters',
        'string.max': 'State must not exceed 50 characters'
      })
  }).required().messages({
    'object.required': 'Location is required'
  }),
  duration: Joi.object({
    value: Joi.number().integer().min(1).required().messages({
      'number.min': 'Duration value must be at least 1',
      'number.base': 'Duration value must be a number'
    }),
    unit: Joi.string()
      .valid(...DURATION_UNITS_ARRAY)
      .required()
      .messages({
        'any.only': 'Duration unit must be hours, days, weeks, or months'
      })
  }).required().messages({
    'object.required': 'Duration is required'
  }),
  maxVolunteers: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.min': 'maxVolunteers must be 0 (unlimited) or at least 1'
    }),
  applicationDeadline: Joi.date()
    .greater('now')
    .optional()
    .messages({
      'date.greater': 'Application deadline must be in the future'
    }),
  status: Joi.any().forbidden().messages({
    'any.unknown': 'Status is set automatically by the server'
  }),
  ngo: Joi.any().forbidden().messages({
    'any.unknown': 'NGO is set automatically by the server'
  }),
  createdBy: Joi.any().forbidden(),
  updatedBy: Joi.any().forbidden(),
  isDeleted: Joi.any().forbidden(),
  deletedAt: Joi.any().forbidden(),
  createdAt: Joi.any().forbidden(),
  updatedAt: Joi.any().forbidden()
});

const updateSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(titleRegex, 'letters, numbers, spaces, -, &, \'')
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title must not exceed 100 characters',
      'string.pattern.name': 'Title can only contain letters, numbers, spaces, -, &, and \''
    }),
  description: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .custom((value) => value.replace(/\s{2,}/g, ' '))
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must not exceed 2000 characters'
    }),
  requiredSkills: Joi.array()
    .items(
      Joi.string().trim().custom((val) => val.toLowerCase()).required()
    )
    .max(20)
    .unique()
    .messages({
      'array.max': 'Maximum 20 skills allowed',
      'array.unique': 'Duplicate skills are not allowed'
    }),
  location: Joi.object({
    city: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .custom((val) => val.replace(/\b\w/g, (c) => c.toUpperCase()))
      .messages({
        'string.min': 'City must be at least 2 characters',
        'string.max': 'City must not exceed 50 characters'
      }),
    state: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .custom((val) => val.replace(/\b\w/g, (c) => c.toUpperCase()))
      .messages({
        'string.min': 'State must be at least 2 characters',
        'string.max': 'State must not exceed 50 characters'
      })
  }),
  duration: Joi.object({
    value: Joi.number().integer().min(1).messages({
      'number.min': 'Duration value must be at least 1',
      'number.base': 'Duration value must be a number'
    }),
    unit: Joi.string()
      .valid(...DURATION_UNITS_ARRAY)
      .messages({
        'any.only': 'Duration unit must be hours, days, weeks, or months'
      })
  }),
  status: Joi.string()
    .valid(...OPPORTUNITY_STATUS_ARRAY)
    .messages({
      'any.only': 'Status must be one of: ' + OPPORTUNITY_STATUS_ARRAY.join(', ')
    }),
  maxVolunteers: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.min': 'maxVolunteers must be 0 (unlimited) or at least 1'
    }),
  applicationDeadline: Joi.date()
    .greater('now')
    .messages({
      'date.greater': 'Application deadline must be in the future'
    }),
  ngo: Joi.any().forbidden(),
  createdBy: Joi.any().forbidden(),
  updatedBy: Joi.any().forbidden(),
  isDeleted: Joi.any().forbidden(),
  deletedAt: Joi.any().forbidden(),
  createdAt: Joi.any().forbidden(),
  updatedAt: Joi.any().forbidden()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const statusChangeSchema = Joi.object({
  status: Joi.string()
    .valid(...OPPORTUNITY_STATUS_ARRAY)
    .required()
    .messages({
      'any.only': 'Status must be one of: ' + OPPORTUNITY_STATUS_ARRAY.join(', '),
      'string.empty': 'Status is required'
    })
});

const validateCreateOpportunity = (data) => createSchema.validate(data, { abortEarly: false, stripUnknown: true });
const validateUpdateOpportunity = (data) => updateSchema.validate(data, { abortEarly: false, stripUnknown: true });
const validateStatusChange = (data) => statusChangeSchema.validate(data, { abortEarly: false });

module.exports = { validateCreateOpportunity, validateUpdateOpportunity, validateStatusChange };
