const mongoose = require('mongoose');
const { ROLES_ARRAY } = require('../constants/roles');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must not exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ROLES_ARRAY,
        message: 'Role must be one of: ' + ROLES_ARRAY.join(', ')
      },
      required: [true, 'Role is required']
    },
    skills: {
      type: [String],
      default: []
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio must not exceed 500 characters'],
      default: ''
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationOtp: {
      type: String,
      select: false
    },
    emailVerificationOtpExpires: {
      type: Date
    },
    emailVerificationAttempts: {
      type: Number,
      default: 0,
      min: 0
    },
    emailVerificationResendCount: {
      type: Number,
      default: 0,
      min: 0
    },
    emailVerificationLockedUntil: {
      type: Date
    },
    lastOtpSentAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('User', userSchema);
