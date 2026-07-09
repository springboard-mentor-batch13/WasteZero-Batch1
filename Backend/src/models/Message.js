const mongoose = require('mongoose');
const { MESSAGE_TYPE_ARRAY, MESSAGE_TYPE } = require('../constants/messageType');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required']
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required']
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [2000, 'Content must not exceed 2000 characters']
    },
    messageType: {
      type: String,
      enum: {
        values: MESSAGE_TYPE_ARRAY,
        message: 'Message type must be one of: ' + MESSAGE_TYPE_ARRAY.join(', ')
      },
      default: MESSAGE_TYPE.TEXT
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
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

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ application: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1 });
messageSchema.index({ sender: 1, receiver: 1, application: 1 });

module.exports = mongoose.model('Message', messageSchema);
