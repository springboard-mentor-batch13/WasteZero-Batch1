const emitNotification = (io, notification) => {
  const receiverId = notification.receiver.toString();
  io.to(`user:${receiverId}`).emit('notification', notification);
};

module.exports = { emitNotification };
