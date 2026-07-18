const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getConversations } = require('../services/conversationService');
const ApiResponse = require('../utils/ApiResponse');

const getConversationsHandler = asyncHandler(async (req, res) => {
  const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : 1;
  const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : 20;

  if (Number.isNaN(page) || page < 1) {
    throw ApiError.badRequest('Page must be a positive integer');
  }

  if (Number.isNaN(limit) || limit < 1) {
    throw ApiError.badRequest('Limit must be a positive integer');
  }

  const result = await getConversations(req.user.id, page, limit);

  return ApiResponse.ok(res, 'Conversations retrieved successfully', result);
});

module.exports = {
  getConversations: getConversationsHandler
};
