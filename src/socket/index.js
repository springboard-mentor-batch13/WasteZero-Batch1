const { Server } = require('socket.io');
const { verifySocketToken } = require('./socketAuth');
const { setupChatHandlers } = require('./chatHandler');

let io = null;

const initIO = (server) => {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use((socket, next) => {
    try {
      const user = verifySocketToken(socket.handshake);
      socket.user = user;
      next();
    } catch (error) {
      next(new Error(error.message));
    }
  });

  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    const userId = socket.user.userId;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId).add(socket.id);
    socket.join(`user:${userId}`);

    io.emit('userOnline', { userId });

    setupChatHandlers(socket, io);

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('userOffline', { userId });
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initIO(server) first.');
  }
  return io;
};

module.exports = { initIO, getIO };
