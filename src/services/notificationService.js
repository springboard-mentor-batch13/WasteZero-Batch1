const Notification = require('../models/Notification');

const getNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const query = { receiver: userId };

  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return { notifications, pagination: { page, limit, total, totalPages } };
};

const getUnreadCount = async (userId) => {
  const unreadCount = await Notification.countDocuments({ receiver: userId, isRead: false });
  return { unreadCount };
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, receiver: userId, isRead: false },
    { isRead: true, readAt: new Date() },
    { returnDocument: 'after' }
  );

  return notification;
};

const markAllRead = async (userId) => {
  const result = await Notification.updateMany(
    { receiver: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return { modifiedCount: result.modifiedCount };
};

const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    receiver: userId
  });

  return notification;
};

const createNotification = async ({ receiver, sender = null, type, title, message, data = {} }) => {
  const notification = await Notification.create({
    receiver,
    sender,
    type,
    title,
    message,
    data
  });

  return notification;
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification,
  createNotification
};
