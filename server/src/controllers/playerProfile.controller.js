const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const Player = require('../models/player.model');
const Payment = require('../models/payment.model');
const Attendance = require('../models/attendance.model');
const Group = require('../models/group.model');
const Coach = require('../models/coach.model');
const { USER_ROLES } = require('../config/constants');

// Get player's own profile
const getMyProfile = catchAsync(async (req, res, next) => {
  const player = await Player.findById(req.user.id).populate({
    path: 'groupId',
    select: 'name description coachId trainingDays trainingTime cancelledDates addedDates dateTimes',
    populate: {
      path: 'coachId',
      select: 'username email phone sportType'
    }
  });
  
  if (!player) {
    return next(new ApiError(404, 'Player not found'));
  }
  
  const playerObj = player.toObject();
  
  // Include group and sport type information
  if (player.groupId) {
    playerObj.group = {
      id: player.groupId._id,
      name: player.groupId.name,
      description: player.groupId.description,
      sportType: player.groupId.coachId?.sportType || null,
      trainingDays: player.groupId.trainingDays || [],
      trainingTime: player.groupId.trainingTime || null,
      cancelledDates: player.groupId.cancelledDates || [],
      addedDates: player.groupId.addedDates || [],
      dateTimes: player.groupId.dateTimes && typeof player.groupId.dateTimes === 'object' ? player.groupId.dateTimes : {},
      coach: player.groupId.coachId ? {
        username: player.groupId.coachId.username,
        email: player.groupId.coachId.email,
        phone: player.groupId.coachId.phone,
      } : null
    };
  }
  
  res.json(playerObj);
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

