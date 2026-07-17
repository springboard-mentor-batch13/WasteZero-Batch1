const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const Message = require('../models/Message');

const getMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : 1;
  const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : 20;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw ApiError.badRequest('Invalid user ID');
  }

  if (Number.isNaN(page) || page < 1) {
    throw ApiError.badRequest('Page must be a positive integer');
  }

  if (Number.isNaN(limit) || limit < 1) {
    throw ApiError.badRequest('Limit must be a positive integer');
  }

  const query = {
    $or: [
      { sender: req.user.id, receiver: userId },
      { sender: userId, receiver: req.user.id }
    ]
  };

  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    Message.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments(query)
  ]);
  const totalPages = Math.ceil(total / limit);
  return ApiResponse.ok(res, 'Messages fetched successfully', { messages, page, limit, total, totalPages });
});

module.exports = {
  getMessages
};
