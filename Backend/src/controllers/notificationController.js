const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const notificationService = require('../services/notificationService');

const getNotifications = asyncHandler(async (req, res) => {
  const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : 1;
  const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : 20;

  if (Number.isNaN(page) || page < 1) {
    throw ApiError.badRequest('Page must be a positive integer');
  }

  if (Number.isNaN(limit) || limit < 1) {
    throw ApiError.badRequest('Limit must be a positive integer');
  }

  const result = await notificationService.getNotifications(req.user.id, page, limit);

  return ApiResponse.ok(res, 'Notifications fetched successfully', result);
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);

  return ApiResponse.ok(res, 'Unread count fetched successfully', result);
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid notification ID');
  }

  const notification = await notificationService.markAsRead(id, req.user.id);

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  return ApiResponse.ok(res, 'Notification marked as read', { notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.id);

  return ApiResponse.ok(res, 'All notifications marked as read', result);
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid notification ID');
  }

  const notification = await notificationService.deleteNotification(id, req.user.id);

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  return ApiResponse.ok(res, 'Notification deleted successfully', { notification });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification
};
