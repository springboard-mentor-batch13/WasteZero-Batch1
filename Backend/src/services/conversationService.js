const Message = require('../models/Message');

const getConversations = async (currentUserId, page = 1, limit = 20) => {
  const userId =
    typeof currentUserId === 'string'
      ? new (require('mongoose').Types.ObjectId)(currentUserId)
      : currentUserId;

  const pipeline = [
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }]
      }
    },
    {
      $addFields: {
        conversationPartner: {
          $cond: [{ $eq: ['$sender', userId]}, '$receiver', '$sender']
        }
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$conversationPartner',
        lastMessage: { $first: '$$ROOT' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'partner'
      }
    },
    { $unwind: '$partner' },
    {
      $project: {
        _id: 0,
        partnerId: '$_id',
        partnerName: '$partner.name',
        partnerRole: '$partner.role',
        lastMessage: 1
      }
    }
  ];

  const skip = (page - 1) * limit;

  const [results, countResult] = await Promise.all([
    Message.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
    Message.aggregate([...pipeline, { $count: 'total' }])
  ]);

  const total = countResult.length > 0 ? countResult[0].total : 0;

  return {
    conversations: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = { getConversations };
