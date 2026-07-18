const { sendMessageSchema } = require('../validators/socket/messageSocketValidator');
const Message = require('../models/Message');
const notificationService = require('../services/notificationService');
const { emitNotification } = require('./notificationHandler');
const { NOTIFICATION_TYPE } = require('../constants/notificationTypes');
const logger = require('../config/logger');

const setupChatHandlers = (socket, io) => {
  socket.on('sendMessage', async (data, callback) => {
    const { error } = sendMessageSchema.validate(data);
    if (error) {
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
      return;
    }

    const message = new Message({
      sender: socket.user.userId,
      receiver: data.receiver,
      content: data.content
    });

    try {
      await message.save();
    } catch (error) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Failed to save message' });
      }
      return;
    }

    io.to(`user:${message.receiver.toString()}`).emit('receiveMessage', message);

    if (typeof callback === 'function') {
      callback({ success: true, message });
    }

    if (message.sender.toString() !== message.receiver.toString()) {
      try {
        const notification = await notificationService.createNotification({
          receiver: message.receiver,
          sender: message.sender,
          type: NOTIFICATION_TYPE.NEW_MESSAGE,
          title: 'New Message',
          message: 'You received a new message',
          data: {
            messageId: message._id,
            senderId: message.sender
          }
        });

        emitNotification(io, notification);
      } catch (err) {
        logger.error('Failed to create notification:', err);
      }
    }
  });

  socket.on('typing', (data) => {
    if (data?.receiver) {
      io.to(`user:${data.receiver}`).emit('typing', { sender: socket.user.userId });
    }
  });

  socket.on('stopTyping', (data) => {
    if (data?.receiver) {
      io.to(`user:${data.receiver}`).emit('stopTyping', { sender: socket.user.userId });
    }
  });
};

module.exports = { setupChatHandlers };
