const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const Pickup = require('../models/Pickup');
const Opportunity = require('../models/Opportunity');
const ApiError = require('../utils/ApiError');
const { ROLES, ROLES_ARRAY } = require('../constants/roles');
const { PICKUP_STATUS, PICKUP_STATUS_ARRAY } = require('../constants/pickupStatus');
const { TIME_SLOTS_ARRAY } = require('../constants/timeSlot');
const { WASTE_TYPES_ARRAY } = require('../constants/wasteType');
const { OPPORTUNITY_STATUS_ARRAY } = require('../constants/opportunityStatus');
const { DURATION_UNITS_ARRAY } = require('../constants/durationUnits');
const { APPLICATION_STATUS_ARRAY } = require('../constants/applicationStatus');
const { ACTIVITY_TYPE, ACTIVITY_TYPE_ARRAY } = require('../constants/activityType');
const { toCsv, buildCsvFilename } = require('../utils/csv');

const REPORT_USER_FIELDS =
  'name email role city.name skills isEmailVerified twoFactorEnabled createdAt';

const USERS_CSV_COLUMNS = [
  'name', 'email', 'role', 'city', 'skills',
  'isEmailVerified', 'twoFactorEnabled', 'joinedAt'
];

const PICKUPS_CSV_COLUMNS = [
  'pickupId', 'userName', 'userEmail', 'city', 'address',
  'pickupDate', 'timeSlot', 'wasteTypes', 'status', 'ngoName',
  'requestedAt', 'completedAt'
];

const OPPORTUNITIES_CSV_COLUMNS = [
  'opportunityId', 'title', 'city', 'state', 'status',
  'durationValue', 'durationUnit', 'maxVolunteers', 'applicationDeadline',
  'ngoName', 'ngoEmail', 'requiredSkills', 'postedAt'
];

const ACTIVITY_CSV_COLUMNS = [
  'activityId', 'activityType', 'actorId', 'actorName', 'actorEmail',
  'actorRole', 'entityId', 'title', 'status', 'date'
];

const isInvalidDate = (value) => Number.isNaN(new Date(value).getTime());

const buildDateFilter = ({ from, to } = {}) => {
  const filter = {};
  if (from) filter.$gte = new Date(from);
  if (to) {
    const end = new Date(to);
    const isDateOnly = end.toISOString().endsWith('T00:00:00.000Z');
    if (isDateOnly) {
      end.setUTCDate(end.getUTCDate() + 1);
      filter.$lt = end;
    } else {
      filter.$lte = end;
    }
  }
  return Object.keys(filter).length ? filter : null;
};

const monthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;

const startOfMonthUTC = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const getActiveUserIds = async (now) => {
  const docs = await RefreshToken.aggregate([
    { $match: { isRevoked: false, expiresAt: { $gt: now } } },
    { $group: { _id: '$user' } }
  ]);
  return docs.map((doc) => doc._id);
};

const buildZeroFilledMonthly = (rows, now) => {
  const counts = new Map();
  rows.forEach((row) => counts.set(monthKey(row._id.year, row._id.month), row.count));
  const monthlyRegistrations = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    monthlyRegistrations.push({
      month: monthKey(d.getUTCFullYear(), d.getUTCMonth() + 1),
      count: counts.get(monthKey(d.getUTCFullYear(), d.getUTCMonth() + 1)) || 0
    });
  }
  return monthlyRegistrations;
};

const generateUsersReport = async ({ from, to } = {}) => {
  if (from && isInvalidDate(from)) throw ApiError.badRequest('Invalid from date');
  if (to && isInvalidDate(to)) throw ApiError.badRequest('Invalid to date');
  if (from && to && new Date(from) > new Date(to)) {
    throw ApiError.badRequest('from must not be after to');
  }

  const now = new Date();
  const dateFilter = buildDateFilter({ from, to });
  const matchStage = dateFilter ? [{ $match: { createdAt: dateFilter } }] : [];

  const statsResult = await User.aggregate([
    ...matchStage,
    {
      $facet: {
        total: [{ $count: 'count' }],
        byRole: [{ $group: { _id: '$role', count: { $sum: 1 } } }],
        newThisMonth: [
          { $match: { createdAt: { $gte: startOfMonthUTC(now) } } },
          { $count: 'count' }
        ],
        monthly: [
          {
            $match: {
              createdAt: {
                $gte: startOfMonthUTC(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)))
              }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: { date: '$createdAt', timezone: 'UTC' } },
                month: { $month: { date: '$createdAt', timezone: 'UTC' } }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]
      }
    }
  ]);

  const stats = statsResult[0] || {};
  const totalUsers = stats.total?.[0]?.count || 0;
  const newThisMonth = stats.newThisMonth?.[0]?.count || 0;

  const byRole = Object.keys(ROLES).reduce((acc, key) => {
    acc[ROLES[key]] = 0;
    return acc;
  }, {});
  (stats.byRole || []).forEach((row) => {
    if (row._id in byRole) byRole[row._id] = row.count;
  });

  const monthlyRegistrations = buildZeroFilledMonthly(stats.monthly || [], now);

  const activeUserIds = await getActiveUserIds(now);
  let activeUsers;
  if (dateFilter) {
    activeUsers = await User.countDocuments({
      _id: { $in: activeUserIds },
      createdAt: dateFilter
    });
  } else {
    activeUsers = activeUserIds.length;
  }

  const users = await User.find(dateFilter ? { createdAt: dateFilter } : {})
    .select(REPORT_USER_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  const reportUsers = users.map((user) => ({
    name: user.name,
    email: user.email,
    role: user.role,
    city: user.city?.name || '',
    skills: user.skills || [],
    isEmailVerified: user.isEmailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    joinedAt: user.createdAt
  }));

  return {
    reportType: 'users',
    generatedAt: now,
    filters: { from: from || null, to: to || null },
    summary: { totalUsers, activeUsers, byRole, newThisMonth, monthlyRegistrations },
    users: reportUsers
  };
};

const zeroFillObject = (rows, keys) => {
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  return keys.reduce((acc, key) => {
    acc[key] = counts.get(key) || 0;
    return acc;
  }, {});
};

const buildPickupsSummary = async ({ from, to } = {}) => {
  if (from && isInvalidDate(from)) throw ApiError.badRequest('Invalid from date');
  if (to && isInvalidDate(to)) throw ApiError.badRequest('Invalid to date');
  if (from && to && new Date(from) > new Date(to)) {
    throw ApiError.badRequest('from must not be after to');
  }

  const now = new Date();
  const dateFilter = buildDateFilter({ from, to });
  const matchStage = dateFilter ? [{ $match: { pickupDate: dateFilter } }] : [];

  const statsResult = await Pickup.aggregate([
    ...matchStage,
    {
      $facet: {
        total: [{ $count: 'count' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byTimeSlot: [{ $group: { _id: '$timeSlot', count: { $sum: 1 } } }],
        byWasteType: [
          { $unwind: '$wasteTypes' },
          { $group: { _id: '$wasteTypes', count: { $sum: 1 } } }
        ],
        byCity: [
          {
            $group: {
              _id: {
                $cond: {
                  if: { $in: ['$city', [null, '']] },
                  then: 'Unknown',
                  else: '$city'
                }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ],
        monthly: [
          {
            $match: {
              pickupDate: {
                $gte: startOfMonthUTC(
                  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
                )
              }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: { date: '$pickupDate', timezone: 'UTC' } },
                month: { $month: { date: '$pickupDate', timezone: 'UTC' } }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ],
        assignedToNgo: [{ $match: { ngo: { $ne: null } } }, { $count: 'count' }],
        unassignedPending: [
          { $match: { status: PICKUP_STATUS.PENDING, ngo: null } },
          { $count: 'count' }
        ]
      }
    }
  ]);

  const stats = statsResult[0] || {};

  return {
    now,
    dateFilter,
    summary: {
      totalPickups: stats.total?.[0]?.count || 0,
      byStatus: zeroFillObject(stats.byStatus || [], PICKUP_STATUS_ARRAY),
      byTimeSlot: zeroFillObject(stats.byTimeSlot || [], TIME_SLOTS_ARRAY),
      byWasteType: zeroFillObject(stats.byWasteType || [], WASTE_TYPES_ARRAY),
      byCity: (stats.byCity || []).map((row) => ({ city: row._id, count: row.count })),
      monthlyPickups: buildZeroFilledMonthly(stats.monthly || [], now),
      assignedToNgo: stats.assignedToNgo?.[0]?.count || 0,
      unassignedPending: stats.unassignedPending?.[0]?.count || 0
    }
  };
};

const buildPickupsList = async ({ dateFilter } = {}) => {
  const pickups = await Pickup.find(dateFilter ? { pickupDate: dateFilter } : {})
    .sort({ pickupDate: -1 })
    .lean();

  if (pickups.length === 0) return [];

  const ids = new Set();
  pickups.forEach((p) => {
    if (p.user) ids.add(String(p.user));
    if (p.ngo) ids.add(String(p.ngo));
  });

  const users = await User.find({ _id: { $in: [...ids] } })
    .select('name email')
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), u]));

  return pickups.map((p) => {
    const requester = p.user ? userMap.get(String(p.user)) : undefined;
    const assignedNgo = p.ngo ? userMap.get(String(p.ngo)) : undefined;
    return {
      pickupId: String(p._id),
      userName: requester?.name || '',
      userEmail: requester?.email || '',
      city: p.city || '',
      address: p.address || '',
      pickupDate: p.pickupDate,
      timeSlot: p.timeSlot,
      wasteTypes: p.wasteTypes || [],
      status: p.status,
      ngoName: assignedNgo?.name || '',
      requestedAt: p.createdAt,
      completedAt: p.completedAt || null
    };
  });
};

const generatePickupsReport = async ({ from, to } = {}) => {
  const { now, dateFilter, summary } = await buildPickupsSummary({ from, to });
  const pickups = await buildPickupsList({ dateFilter });

  return {
    reportType: 'pickups',
    generatedAt: now,
    filters: { from: from || null, to: to || null },
    summary,
    pickups
  };
};

const generateOpportunitiesReport = async ({ from, to, page = 1, limit = 20 } = {}) => {
  const { now, dateFilter, summary } = await buildOpportunitiesSummary({ from, to });
  const { items, pagination } = await buildOpportunitiesList({ dateFilter, page, limit });

  return {
    reportType: 'opportunities',
    generatedAt: now,
    filters: { from: from || null, to: to || null },
    summary,
    opportunities: items,
    pagination
  };
};

const buildOpportunitiesSummary = async ({ from, to } = {}) => {
  if (from && isInvalidDate(from)) throw ApiError.badRequest('Invalid from date');
  if (to && isInvalidDate(to)) throw ApiError.badRequest('Invalid to date');
  if (from && to && new Date(from) > new Date(to)) {
    throw ApiError.badRequest('from must not be after to');
  }

  const now = new Date();
  const dateFilter = buildDateFilter({ from, to });
  const filter = { isDeleted: false };
  if (dateFilter) filter.createdAt = dateFilter;
  const matchStage = [{ $match: filter }];

  const statsResult = await Opportunity.aggregate([
    ...matchStage,
    {
      $facet: {
        total: [{ $count: 'count' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byCity: [
          {
            $group: {
              _id: {
                $cond: {
                  if: { $in: ['$location.city', [null, '']] },
                  then: 'Unknown',
                  else: '$location.city'
                }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1, _id: 1 } }
        ],
        byNgo: [
          { $group: { _id: '$ngo', count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'ngoInfo'
            }
          },
          { $unwind: { path: '$ngoInfo', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              ngoId: '$_id',
              ngoName: { $ifNull: ['$ngoInfo.name', ''] },
              count: 1
            }
          }
        ],
        byDurationUnit: [{ $group: { _id: '$duration.unit', count: { $sum: 1 } } }],
        monthly: [
          {
            $match: {
              createdAt: {
                $gte: startOfMonthUTC(
                  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
                )
              }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: { date: '$createdAt', timezone: 'UTC' } },
                month: { $month: { date: '$createdAt', timezone: 'UTC' } }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]
      }
    }
  ]);

  const stats = statsResult[0] || {};

  return {
    now,
    dateFilter,
    summary: {
      totalOpportunities: stats.total?.[0]?.count || 0,
      byStatus: zeroFillObject(stats.byStatus || [], OPPORTUNITY_STATUS_ARRAY),
      byCity: (stats.byCity || []).map((row) => ({ city: row._id, count: row.count })),
      byNgo: (stats.byNgo || []).map((row) => ({
        ngoId: String(row.ngoId),
        ngoName: row.ngoName || '',
        count: row.count
      })),
      byDurationUnit: zeroFillObject(stats.byDurationUnit || [], DURATION_UNITS_ARRAY),
      monthlyPosted: buildZeroFilledMonthly(stats.monthly || [], now)
    }
  };
};

const buildOpportunitiesList = async ({ dateFilter, page = 1, limit = 20 } = {}) => {
  const filter = { isDeleted: false };
  if (dateFilter) filter.createdAt = dateFilter;

  const total = await Opportunity.countDocuments(filter);
  const skip = (page - 1) * limit;
  const opportunities = await Opportunity.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  let items = [];
  if (opportunities.length > 0) {
    const ids = new Set();
    opportunities.forEach((opp) => {
      if (opp.ngo) ids.add(String(opp.ngo));
    });

    const users = await User.find({ _id: { $in: [...ids] } })
      .select('name email')
      .lean();

    const userMap = new Map(users.map((u) => [String(u._id), u]));

    items = opportunities.map((opp) => {
      const ngoUser = opp.ngo ? userMap.get(String(opp.ngo)) : undefined;
      return {
        opportunityId: String(opp._id),
        title: opp.title,
        city: opp.location?.city || '',
        state: opp.location?.state || '',
        status: opp.status,
        durationValue: opp.duration?.value ?? null,
        durationUnit: opp.duration?.unit || '',
        maxVolunteers: opp.maxVolunteers ?? 0,
        applicationDeadline: opp.applicationDeadline || null,
        ngoName: ngoUser?.name || '',
        ngoEmail: ngoUser?.email || '',
        requiredSkills: opp.requiredSkills || [],
        postedAt: opp.createdAt
      };
    });
  }

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0
    }
  };
};

const buildActivitySummary = async ({ from, to } = {}) => {
  if (from && isInvalidDate(from)) throw ApiError.badRequest('Invalid from date');
  if (to && isInvalidDate(to)) throw ApiError.badRequest('Invalid to date');
  if (from && to && new Date(from) > new Date(to)) {
    throw ApiError.badRequest('from must not be after to');
  }

  const now = new Date();
  const dateFilter = buildDateFilter({ from, to });

  const userMatch = dateFilter ? { createdAt: dateFilter } : {};
  const oppMatch = dateFilter
    ? { isDeleted: false, createdAt: dateFilter }
    : { isDeleted: false };
  const appMatch = dateFilter ? { createdAt: dateFilter } : {};

  const statsResult = await User.aggregate([
    { $match: userMatch },
    {
      $project: {
        activityType: ACTIVITY_TYPE.USER_REGISTERED,
        actorId: '$_id',
        actorRole: '$role',
        date: '$createdAt',
        status: null
      }
    },
    {
      $unionWith: {
        coll: 'opportunities',
        pipeline: [
          { $match: oppMatch },
          {
            $project: {
              activityType: ACTIVITY_TYPE.OPPORTUNITY_POSTED,
              actorId: '$ngo',
              actorRole: ROLES.NGO,
              date: '$createdAt',
              status: '$status'
            }
          }
        ]
      }
    },
    {
      $unionWith: {
        coll: 'applications',
        pipeline: [
          { $match: appMatch },
          {
            $project: {
              activityType: ACTIVITY_TYPE.APPLICATION_SUBMITTED,
              actorId: '$volunteer',
              actorRole: ROLES.VOLUNTEER,
              date: '$createdAt',
              status: '$status'
            }
          }
        ]
      }
    },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byActivityType: [{ $group: { _id: '$activityType', count: { $sum: 1 } } }],
        byActorRole: [{ $group: { _id: '$actorRole', count: { $sum: 1 } } }],
        byApplicationStatus: [
          { $match: { activityType: ACTIVITY_TYPE.APPLICATION_SUBMITTED } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        monthly: [
          {
            $match: {
              date: {
                $gte: startOfMonthUTC(
                  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
                )
              }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: { date: '$date', timezone: 'UTC' } },
                month: { $month: { date: '$date', timezone: 'UTC' } }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]
      }
    }
  ]);

  const stats = statsResult[0] || {};

  return {
    now,
    dateFilter,
    summary: {
      totalActivities: stats.total?.[0]?.count || 0,
      byActivityType: zeroFillObject(stats.byActivityType || [], ACTIVITY_TYPE_ARRAY),
      byActorRole: zeroFillObject(stats.byActorRole || [], ROLES_ARRAY),
      byApplicationStatus: zeroFillObject(
        stats.byApplicationStatus || [],
        APPLICATION_STATUS_ARRAY
      ),
      monthlyActivity: buildZeroFilledMonthly(stats.monthly || [], now)
    }
  };
};

const buildActivityList = async ({ dateFilter, page = 1, limit = 20 } = {}) => {
  const userMatch = dateFilter ? { createdAt: dateFilter } : {};
  const oppMatch = dateFilter
    ? { isDeleted: false, createdAt: dateFilter }
    : { isDeleted: false };
  const appMatch = dateFilter ? { createdAt: dateFilter } : {};

  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: userMatch },
    {
      $project: {
        activityType: ACTIVITY_TYPE.USER_REGISTERED,
        actorId: '$_id',
        actorRole: '$role',
        entityId: null,
        title: null,
        status: null,
        date: '$createdAt',
        oppId: null
      }
    },
    {
      $unionWith: {
        coll: 'opportunities',
        pipeline: [
          { $match: oppMatch },
          {
            $project: {
              activityType: ACTIVITY_TYPE.OPPORTUNITY_POSTED,
              actorId: '$ngo',
              actorRole: ROLES.NGO,
              entityId: '$_id',
              title: '$title',
              status: '$status',
              date: '$createdAt',
              oppId: '$_id'
            }
          }
        ]
      }
    },
    {
      $unionWith: {
        coll: 'applications',
        pipeline: [
          { $match: appMatch },
          {
            $project: {
              activityType: ACTIVITY_TYPE.APPLICATION_SUBMITTED,
              actorId: '$volunteer',
              actorRole: ROLES.VOLUNTEER,
              entityId: '$_id',
              title: null,
              status: '$status',
              date: '$createdAt',
              oppId: '$opportunity'
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: 'users',
        let: { aid: '$actorId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$aid'] } } },
          { $project: { name: 1, email: 1 } }
        ],
        as: 'actor'
      }
    },
    { $unwind: { path: '$actor', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'opportunities',
        let: { oid: '$oppId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$oid'] } } },
          { $project: { title: 1 } }
        ],
        as: 'opp'
      }
    },
    { $unwind: { path: '$opp', preserveNullAndEmptyArrays: true } },
    { $sort: { date: -1, _id: -1 } },
    {
      $facet: {
        total: [{ $count: 'count' }],
        rows: [{ $skip: skip }, { $limit: limit }]
      }
    }
  ];

  const [result] = await User.aggregate(pipeline);
  const total = result?.total?.[0]?.count || 0;
  const rows = result?.rows || [];

  const items = rows.map((row) => ({
    activityId: String(row._id),
    activityType: row.activityType,
    actorId: row.actorId ? String(row.actorId) : '',
    actorName: row.actor?.name || '',
    actorEmail: row.actor?.email || '',
    actorRole: row.actorRole,
    entityId: row.entityId ? String(row.entityId) : '',
    title: row.title || row.opp?.title || '',
    status: row.status || '',
    date: row.date
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0
    }
  };
};

const generateActivityReport = async ({ from, to, page = 1, limit = 20 } = {}) => {
  const { now, dateFilter, summary } = await buildActivitySummary({ from, to });
  const { items, pagination } = await buildActivityList({ dateFilter, page, limit });

  return {
    reportType: 'activity',
    generatedAt: now,
    filters: { from: from || null, to: to || null },
    summary,
    activities: items,
    pagination
  };
};

const CSV_EXPORT_LIMIT = Number.MAX_SAFE_INTEGER;

const generateUsersReportCsv = async ({ from, to } = {}) => {
  const report = await generateUsersReport({ from, to });
  return {
    filename: buildCsvFilename('users', to),
    content: toCsv(USERS_CSV_COLUMNS, report.users)
  };
};

const generatePickupsReportCsv = async ({ from, to } = {}) => {
  const report = await generatePickupsReport({ from, to });
  return {
    filename: buildCsvFilename('pickups', to),
    content: toCsv(PICKUPS_CSV_COLUMNS, report.pickups)
  };
};

const generateOpportunitiesReportCsv = async ({ from, to } = {}) => {
  const report = await generateOpportunitiesReport({ from, to, page: 1, limit: CSV_EXPORT_LIMIT });
  return {
    filename: buildCsvFilename('opportunities', to),
    content: toCsv(OPPORTUNITIES_CSV_COLUMNS, report.opportunities)
  };
};

const generateActivityReportCsv = async ({ from, to } = {}) => {
  const report = await generateActivityReport({ from, to, page: 1, limit: CSV_EXPORT_LIMIT });
  return {
    filename: buildCsvFilename('activity', to),
    content: toCsv(ACTIVITY_CSV_COLUMNS, report.activities)
  };
};

module.exports = {
  generateUsersReport,
  generatePickupsReport,
  generateOpportunitiesReport,
  generateActivityReport,
  generateUsersReportCsv,
  generatePickupsReportCsv,
  generateOpportunitiesReportCsv,
  generateActivityReportCsv
};
