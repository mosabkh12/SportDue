const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const Player = require('../models/player.model');
const Payment = require('../models/payment.model');
const Attendance = require('../models/attendance.model');
const { USER_ROLES } = require('../config/constants');

// Get player's own profile
const getMyProfile = catchAsync(async (req, res, next) => {
  const player = await Player.findById(req.user.id);
  if (!player) {
    return next(new ApiError(404, 'Player not found'));
  }
  res.json(player);
});

// Get player's own payments
const getMyPayments = catchAsync(async (req, res) => {
  const payments = await Payment.find({ playerId: req.user.id }).sort({ month: -1 });
  res.json(payments);
});

// Get player's own attendance
const getMyAttendance = catchAsync(async (req, res) => {
  const attendanceRecords = await Attendance.find({ playerId: req.user.id })
    .sort({ date: -1 })
    .limit(100); // Limit to last 100 records for performance

  res.json(attendanceRecords);
});

// Update player's own password
const updateMyPassword = catchAsync(async (req, res, next) => {
  const { newPassword } = req.body;
  const player = await Player.findById(req.user.id);

  if (!player) {
    return next(new ApiError(404, 'Player not found'));
  }

  if (!newPassword) {
    return next(new ApiError(400, 'New password is required'));
  }

  player.password = newPassword;
  await player.save();

  res.json({ message: 'Password updated successfully' });
});

module.exports = {
  getMyProfile,
  getMyPayments,
  getMyAttendance,
  updateMyPassword,
};

