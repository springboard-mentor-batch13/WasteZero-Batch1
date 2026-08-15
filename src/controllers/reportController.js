const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { sendCsvResponse } = require('../utils/csv');
const { validateReportQuery } = require('../validators/reportValidator');
const {
  generateUsersReport,
  generatePickupsReport,
  generateOpportunitiesReport,
  generateActivityReport,
  generateUsersReportCsv,
  generatePickupsReportCsv,
  generateOpportunitiesReportCsv,
  generateActivityReportCsv
} = require('../services/reportService');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_PAGE = 100000;

const parsePaginationParam = (raw, defaultValue, maxValue, name) => {
  if (raw === undefined) return defaultValue;
  if (typeof raw !== 'string' || raw.trim() === '' || !Number.isInteger(Number(raw))) {
    throw ApiError.badRequest(`${name} must be a valid integer`);
  }
  const value = Number(raw);
  if (value < 1 || value > maxValue) {
    throw ApiError.badRequest(`${name} must be between 1 and ${maxValue}`);
  }
  return value;
};

const getUsersReport = asyncHandler(async (req, res) => {
  const { error, value } = validateReportQuery(req.query);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  if (value.format === 'csv') {
    const csv = await generateUsersReportCsv(value);
    return sendCsvResponse(res, csv.filename, csv.content);
  }

  const report = await generateUsersReport(value);
  return ApiResponse.ok(res, 'Users report generated successfully', report);
});

const getPickupsReport = asyncHandler(async (req, res) => {
  const { error, value } = validateReportQuery(req.query);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  if (value.format === 'csv') {
    const csv = await generatePickupsReportCsv(value);
    return sendCsvResponse(res, csv.filename, csv.content);
  }

  const report = await generatePickupsReport(value);
  return ApiResponse.ok(res, 'Pickups report generated successfully', report);
});

const getOpportunitiesReport = asyncHandler(async (req, res) => {
  const { page: rawPage, limit: rawLimit, ...restQuery } = req.query;

  const { error, value } = validateReportQuery(restQuery);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  if (value.format === 'csv') {
    if (rawPage !== undefined || rawLimit !== undefined) {
      throw ApiError.badRequest('page/limit not supported for csv export');
    }
    const csv = await generateOpportunitiesReportCsv(value);
    return sendCsvResponse(res, csv.filename, csv.content);
  }

  const page = parsePaginationParam(rawPage, DEFAULT_PAGE, MAX_PAGE, 'page');
  const limit = parsePaginationParam(rawLimit, DEFAULT_LIMIT, MAX_LIMIT, 'limit');

  const report = await generateOpportunitiesReport({ ...value, page, limit });
  return ApiResponse.ok(res, 'Opportunities report generated successfully', report);
});

const getActivityReport = asyncHandler(async (req, res) => {
  const { page: rawPage, limit: rawLimit, ...restQuery } = req.query;

  const { error, value } = validateReportQuery(restQuery);
  if (error) {
    return ApiResponse.validationError(res, error);
  }

  if (value.format === 'csv') {
    if (rawPage !== undefined || rawLimit !== undefined) {
      throw ApiError.badRequest('page/limit not supported for csv export');
    }
    const csv = await generateActivityReportCsv(value);
    return sendCsvResponse(res, csv.filename, csv.content);
  }

  const page = parsePaginationParam(rawPage, DEFAULT_PAGE, MAX_PAGE, 'page');
  const limit = parsePaginationParam(rawLimit, DEFAULT_LIMIT, MAX_LIMIT, 'limit');

  const report = await generateActivityReport({ ...value, page, limit });
  return ApiResponse.ok(res, 'Full activity report generated successfully', report);
});

module.exports = {
  getUsersReport,
  getPickupsReport,
  getOpportunitiesReport,
  getActivityReport
};
