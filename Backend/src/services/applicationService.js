const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');
const ApiError = require('../utils/ApiError');
const { APPLICATION_STATUS } = require('../constants/applicationStatus');
const { OPPORTUNITY_STATUS } = require('../constants/opportunityStatus');

const joinOpportunity = async (opportunityId, volunteerId) => {
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity || opportunity.isDeleted) {
    throw ApiError.notFound('Opportunity not found');
  }

  if (opportunity.status !== OPPORTUNITY_STATUS.OPEN) {
    throw ApiError.badRequest('This opportunity is no longer accepting volunteers');
  }

  if (opportunity.applicationDeadline && opportunity.applicationDeadline < new Date()) {
    throw ApiError.badRequest('The application deadline for this opportunity has passed');
  }

  if (opportunity.maxVolunteers > 0) {
    const acceptedCount = await Application.countDocuments({
      opportunity: opportunityId,
      status: { $in: [APPLICATION_STATUS.PENDING, APPLICATION_STATUS.ACCEPTED] }
    });

    if (acceptedCount >= opportunity.maxVolunteers) {
      throw ApiError.badRequest('This opportunity has reached its maximum number of volunteers');
    }
  }

  const existing = await Application.findOne({ opportunity: opportunityId, volunteer: volunteerId });
  if (existing) {
    if (existing.status === APPLICATION_STATUS.WITHDRAWN) {
      existing.status = APPLICATION_STATUS.PENDING;
      existing.updatedBy = volunteerId;
      existing.reviewedBy = null;
      existing.reviewedAt = null;
      await existing.save();
      return existing;
    }
    throw ApiError.conflict('You have already joined this opportunity');
  }

  const application = await Application.create({
    opportunity: opportunityId,
    volunteer: volunteerId,
    status: APPLICATION_STATUS.PENDING
  });

  return application;
};

const withdrawApplication = async (opportunityId, volunteerId) => {
  const application = await Application.findOne({ opportunity: opportunityId, volunteer: volunteerId });

  if (!application || application.status === APPLICATION_STATUS.WITHDRAWN) {
    throw ApiError.notFound('You have not joined this opportunity');
  }

  application.status = APPLICATION_STATUS.WITHDRAWN;
  application.updatedBy = volunteerId;
  await application.save();

  return application;
};

const getMyApplications = async (volunteerId) => {
  const applications = await Application.find({ volunteer: volunteerId })
    .populate('opportunity', 'title status location duration')
    .sort({ createdAt: -1 })
    .lean();

  applications.forEach((app) => delete app.__v);
  return applications;
};

const getApplicantsForOpportunity = async (opportunityId, requesterId, requesterRole) => {
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity || opportunity.isDeleted) {
    throw ApiError.notFound('Opportunity not found');
  }

  if (requesterRole !== 'admin' && opportunity.ngo.toString() !== requesterId) {
    throw ApiError.forbidden('You are not allowed to view applicants for this opportunity');
  }

  const applications = await Application.find({ opportunity: opportunityId })
    .populate('volunteer', 'name email skills')
    .sort({ createdAt: -1 })
    .lean();

  applications.forEach((app) => delete app.__v);
  return applications;
};

const ALLOWED_APPLICATION_TRANSITIONS = {
  [APPLICATION_STATUS.PENDING]: [APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.REJECTED],
  [APPLICATION_STATUS.ACCEPTED]: [APPLICATION_STATUS.REJECTED],
  [APPLICATION_STATUS.REJECTED]: [APPLICATION_STATUS.ACCEPTED],
  [APPLICATION_STATUS.WITHDRAWN]: []
};

const updateApplicationStatus = async (applicationId, newStatus, reviewerId, reviewerRole) => {
  const application = await Application.findById(applicationId).populate('opportunity');

  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  const opportunity = application.opportunity;
  if (!opportunity || opportunity.isDeleted) {
    throw ApiError.notFound('Opportunity not found');
  }

  if (reviewerRole !== 'admin' && opportunity.ngo.toString() !== reviewerId) {
    throw ApiError.forbidden('You are not allowed to review applicants for this opportunity');
  }

  if (application.status === newStatus) {
    return application;
  }

  const allowed = ALLOWED_APPLICATION_TRANSITIONS[application.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw ApiError.badRequest(`Cannot change application status from ${application.status} to ${newStatus}`);
  }

  if (newStatus === APPLICATION_STATUS.ACCEPTED && opportunity.maxVolunteers > 0) {
    const acceptedCount = await Application.countDocuments({
      opportunity: opportunity._id,
      status: APPLICATION_STATUS.ACCEPTED
    });

    if (acceptedCount >= opportunity.maxVolunteers) {
      throw ApiError.badRequest('This opportunity has already reached its maximum number of volunteers');
    }
  }

  application.status = newStatus;
  application.updatedBy = reviewerId;
  application.reviewedBy = reviewerId;
  application.reviewedAt = new Date();
  await application.save();

  return application;
};

module.exports = {
  joinOpportunity,
  withdrawApplication,
  getMyApplications,
  getApplicantsForOpportunity,
  updateApplicationStatus
};
