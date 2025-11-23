const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const Player = require('../models/player.model');
const Payment = require('../models/payment.model');
const Attendance = require('../models/attendance.model');
const { ensureGroupOwnership, ensurePlayerOwnership } = require('../utils/ownership');

const listGroupPlayers = catchAsync(async (req, res) => {
  await ensureGroupOwnership(req.params.groupId, req.user.id);
  const players = await Player.find({ groupId: req.params.groupId }).sort({ createdAt: -1 });
  res.json(players);
});

const addPlayer = catchAsync(async (req, res, next) => {
  const { fullName, phone, monthlyFee, notes } = req.body;

  if (!fullName || !phone || typeof monthlyFee === 'undefined') {
    return next(new ApiError(400, 'Full name, phone, and monthly fee are required'));
  }

  await ensureGroupOwnership(req.params.groupId, req.user.id);

  const player = await Player.create({
    groupId: req.params.groupId,
    fullName,
    phone,
    monthlyFee,
    notes,
  });

  res.status(201).json(player);
});

const getPlayerDetails = catchAsync(async (req, res) => {
  const player = await ensurePlayerOwnership(req.params.playerId, req.user.id);
  res.json(player);
});

const updatePlayer = catchAsync(async (req, res, next) => {
  const allowed = ['fullName', 'phone', 'monthlyFee', 'notes'];
  const updates = {};

  allowed.forEach((field) => {
    if (typeof req.body[field] !== 'undefined') {
      updates[field] = req.body[field];
    }
  });

  if (!Object.keys(updates).length) {
    return next(new ApiError(400, 'No valid fields provided'));
  }

  const player = await ensurePlayerOwnership(req.params.playerId, req.user.id);

  Object.assign(player, updates);
  await player.save();

  res.json(player);
});

const deletePlayer = catchAsync(async (req, res, next) => {
  const player = await ensurePlayerOwnership(req.params.playerId, req.user.id);

  await Promise.all([
    Player.deleteOne({ _id: player._id }),
    Payment.deleteMany({ playerId: player._id }),
    Attendance.deleteMany({ playerId: player._id }),
  ]);

  res.json({ message: 'Player deleted successfully' });
});

const listPlayerAttendance = catchAsync(async (req, res) => {
  await ensurePlayerOwnership(req.params.playerId, req.user.id);

  const attendanceRecords = await Attendance.find({ playerId: req.params.playerId })
    .sort({ date: -1 })
    .limit(100); // Limit to last 100 records for performance

  res.json(attendanceRecords);
});

module.exports = {
  listGroupPlayers,
  addPlayer,
  getPlayerDetails,
  updatePlayer,
  deletePlayer,
  listPlayerAttendance,
};

