const mongoose = require('mongoose');
const { NOTIFICATION_TYPE_ARRAY } = require('../constants/notificationTypes');

const notificationSchema = new mongoose.Schema(
  {
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPE_ARRAY,
        message: 'Notification type must be one of: ' + NOTIFICATION_TYPE_ARRAY.join(', ')
      },
      required: [true, 'Notification type is required']
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title must not exceed 100 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [500, 'Message must not exceed 500 characters']
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
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

notificationSchema.index({ receiver: 1, createdAt: -1 });
notificationSchema.index({ receiver: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
