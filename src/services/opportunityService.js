const Opportunity = require('../models/Opportunity');
const ApiError = require('../utils/ApiError');
const { OPPORTUNITY_STATUS } = require('../constants/opportunityStatus');

const ALLOWED_TRANSITIONS = {
  [OPPORTUNITY_STATUS.OPEN]: [OPPORTUNITY_STATUS.IN_PROGRESS, OPPORTUNITY_STATUS.CLOSED, OPPORTUNITY_STATUS.CANCELLED],
  [OPPORTUNITY_STATUS.IN_PROGRESS]: [OPPORTUNITY_STATUS.CLOSED],
  [OPPORTUNITY_STATUS.CLOSED]: [OPPORTUNITY_STATUS.OPEN],
  [OPPORTUNITY_STATUS.CANCELLED]: []
};

const createOpportunity = async (data, userId) => {
  const opportunity = await Opportunity.create({
    ...data,
    status: OPPORTUNITY_STATUS.OPEN,
    ngo: userId,
    createdBy: userId,
    updatedBy: userId
  });

  return opportunity;
};

const buildFilterQuery = (query) => {
  const filter = { isDeleted: false };

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.location) {
    filter['location.city'] = { $regex: new RegExp(`^${query.location}$`, 'i') };
  }

  if (query.skill) {
    filter.requiredSkills = { $in: [query.skill.toLowerCase()] };
  }

  return filter;
};

const getPaginationOptions = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  let sort = { createdAt: -1 };
  if (query.sort === 'oldest') {
    sort = { createdAt: 1 };
  }

  return { page, limit, skip, sort };
};

const getAllOpportunities = async (query) => {
  const filter = buildFilterQuery(query);
  const { page, limit, skip, sort } = getPaginationOptions(query);

  const [opportunities, total] = await Promise.all([
    Opportunity.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Opportunity.countDocuments(filter)
  ]);

  opportunities.forEach((opp) => delete opp.__v);

  return {
    opportunities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getOpportunityById = async (id) => {
  const opportunity = await Opportunity.findOne({ _id: id, isDeleted: false }).lean();
  if (!opportunity) {
    throw ApiError.notFound('Opportunity not found');
  }
  delete opportunity.__v;
  return opportunity;
};

const validateStatusTransition = (currentStatus, newStatus, userId, userRole) => {
  if (currentStatus === newStatus) {
    return;
  }

  if (newStatus === OPPORTUNITY_STATUS.OPEN && currentStatus === OPPORTUNITY_STATUS.CLOSED) {
    if (userRole !== 'admin') {
      throw ApiError.forbidden('Only admins can reopen a closed opportunity');
    }
    return;
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw ApiError.badRequest(
      `Cannot transition from ${currentStatus} to ${newStatus}`
    );
  }
};

const updateOpportunity = async (id, data, userId, userRole) => {
  const opportunity = await Opportunity.findById(id);
  if (!opportunity || opportunity.isDeleted) {
    throw ApiError.notFound('Opportunity not found');
  }

  if (data.status && data.status !== opportunity.status) {
    validateStatusTransition(opportunity.status, data.status, userId, userRole);
  }

  if (data.applicationDeadline && data.applicationDeadline <= new Date()) {
    throw ApiError.badRequest('Application deadline must be in the future');
  }

  data.updatedBy = userId;

  const updated = await Opportunity.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true
  });

  return updated;
};

const deleteOpportunity = async (id, userId) => {
  const opportunity = await Opportunity.findById(id);
  if (!opportunity || opportunity.isDeleted) {
    throw ApiError.notFound('Opportunity not found');
  }

  opportunity.isDeleted = true;
  opportunity.deletedAt = new Date();
  opportunity.updatedBy = userId;
  await opportunity.save();

  return { id, deletedAt: opportunity.deletedAt };
};

const changeStatus = async (id, newStatus, userId, userRole) => {
  const opportunity = await Opportunity.findById(id);
  if (!opportunity || opportunity.isDeleted) {
    throw ApiError.notFound('Opportunity not found');
  }

  validateStatusTransition(opportunity.status, newStatus, userId, userRole);

  opportunity.status = newStatus;
  opportunity.updatedBy = userId;
  await opportunity.save();

  return opportunity;
};

module.exports = {
  createOpportunity,
  getAllOpportunities,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
  changeStatus
};
