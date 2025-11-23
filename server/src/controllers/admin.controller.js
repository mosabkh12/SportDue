const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const Coach = require('../models/coach.model');
const Admin = require('../models/admin.model');
const { getCoachSummary } = require('../services/statsService');

const getAdminProfile = catchAsync(async (req, res, next) => {
  const admin = await Admin.findById(req.user.id);
  if (!admin) {
    return next(new ApiError(404, 'Admin not found'));
  }

  res.json({
    id: admin._id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
  });
});

const updateAdminProfile = catchAsync(async (req, res, next) => {
  const admin = await Admin.findById(req.user.id);
  if (!admin) {
    return next(new ApiError(404, 'Admin not found'));
  }

  const { username, newPassword } = req.body;
  let hasUpdates = false;

  if (typeof username === 'string') {
    const nextUsername = username.trim().toLowerCase();
    if (!nextUsername) {
      return next(new ApiError(400, 'Username cannot be empty'));
    }
    if (nextUsername !== admin.username) {
      const exists = await Admin.findOne({ _id: { $ne: admin._id }, username: nextUsername });
      if (exists) {
        return next(new ApiError(409, 'Username already in use'));
      }
      admin.username = nextUsername;
      hasUpdates = true;
    }
  }

  if (newPassword) {
    admin.password = newPassword;
    hasUpdates = true;
  }

  if (!hasUpdates) {
    return next(new ApiError(400, 'No valid fields provided'));
  }

  await admin.save();

  res.json({
    id: admin._id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
  });
});

const listCoaches = catchAsync(async (_req, res) => {
  const coaches = await Coach.find().sort({ createdAt: -1 });

  const data = await Promise.all(
    coaches.map(async (coach) => {
      const summary = await getCoachSummary(coach._id);
      return {
        id: coach._id,
        username: coach.username,
        email: coach.email,
        phone: coach.phone,
        isActive: coach.isActive,
        ...summary,
      };
    })
  );

  res.json(data);
});

const toggleCoachStatus = catchAsync(async (req, res, next) => {
  const coach = await Coach.findById(req.params.coachId);

  if (!coach) {
    return next(new ApiError(404, 'Coach not found'));
  }

  coach.isActive = !coach.isActive;
  await coach.save();

  res.json({ id: coach._id, isActive: coach.isActive });
});

const getCoachSummaryDetails = catchAsync(async (req, res, next) => {
  const coach = await Coach.findById(req.params.coachId);

  if (!coach) {
    return next(new ApiError(404, 'Coach not found'));
  }

  const summary = await getCoachSummary(coach._id);

  res.json({
    coach: {
      id: coach._id,
      username: coach.username,
      email: coach.email,
      phone: coach.phone,
      isActive: coach.isActive,
    },
    summary,
  });
});

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  listCoaches,
  toggleCoachStatus,
  getCoachSummaryDetails,
};

