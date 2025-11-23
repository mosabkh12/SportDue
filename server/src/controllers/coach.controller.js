const Coach = require('../models/coach.model');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/apiError');
const { getCoachSummary } = require('../services/statsService');

const getProfile = catchAsync(async (req, res, next) => {
  const coach = await Coach.findById(req.user.id);
  if (!coach) {
    return next(new ApiError(404, 'Coach not found'));
  }
  res.json({
    id: coach._id,
    username: coach.username,
    email: coach.email,
    phone: coach.phone,
    isActive: coach.isActive,
    createdAt: coach.createdAt,
  });
});

const updateProfile = catchAsync(async (req, res, next) => {
  const { newPassword } = req.body;
  const coach = await Coach.findById(req.user.id);

  if (!coach) {
    return next(new ApiError(404, 'Coach not found'));
  }

  let hasUpdates = false;

  if (typeof req.body.username === 'string') {
    const username = req.body.username.trim().toLowerCase();
    if (!username) {
      return next(new ApiError(400, 'Username cannot be empty'));
    }
    if (username !== coach.username) {
      const exists = await Coach.findOne({ _id: { $ne: coach._id }, username });
      if (exists) {
        return next(new ApiError(409, 'Username is already in use'));
      }
      coach.username = username;
      hasUpdates = true;
    }
  }

  if (typeof req.body.phone !== 'undefined') {
    coach.phone = req.body.phone;
    hasUpdates = true;
  }

  if (newPassword) {
    coach.password = newPassword;
    hasUpdates = true;
  }

  if (!hasUpdates) {
    return next(new ApiError(400, 'No valid fields provided'));
  }

  await coach.save();

  res.json({
    id: coach._id,
    username: coach.username,
    email: coach.email,
    phone: coach.phone,
    role: coach.role,
    isActive: coach.isActive,
  });
});

const getCoachPaymentSummary = catchAsync(async (req, res) => {
  const summary = await getCoachSummary(req.user.id);
  res.json(summary);
});

module.exports = {
  getProfile,
  updateProfile,
  getCoachPaymentSummary,
};

