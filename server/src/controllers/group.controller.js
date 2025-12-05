const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const Group = require('../models/group.model');
const Player = require('../models/player.model');
const Payment = require('../models/payment.model');
const Attendance = require('../models/attendance.model');
const { ensureGroupOwnership } = require('../utils/ownership');

const listGroups = catchAsync(async (req, res) => {
  const groups = await Group.find({ coachId: req.user.id }).sort({ createdAt: -1 });
  const groupIds = groups.map((group) => group._id);

  const counts = await Player.aggregate([
    { $match: { groupId: { $in: groupIds } } },
    { $group: { _id: '$groupId', count: { $sum: 1 } } },
  ]);

  const countMap = counts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  const payload = groups.map((group) => ({
    ...group.toObject(),
    playerCount: countMap[group._id.toString()] || 0,
  }));

  res.json(payload);
});

const createGroup = catchAsync(async (req, res, next) => {
  const { name, description, defaultMonthlyFee, paymentDueDay } = req.body;

  if (!name) {
    return next(new ApiError(400, 'Group name is required'));
  }

  const group = await Group.create({
    coachId: req.user.id,
    name,
    description,
    defaultMonthlyFee,
    paymentDueDay: paymentDueDay || 1,
  });

  res.status(201).json(group);
});

const getGroupDetails = catchAsync(async (req, res) => {
  const group = await ensureGroupOwnership(req.params.groupId, req.user.id);
  const players = await Player.find({ groupId: group._id }).sort({ createdAt: -1 });
  res.json({ group, players });
});

const updateGroup = catchAsync(async (req, res, next) => {
  const allowed = ['name', 'description', 'defaultMonthlyFee', 'paymentDueDay', 'trainingDays', 'trainingTime', 'cancelledDates', 'addedDates', 'dateTimes'];
  const updates = {};

  allowed.forEach((field) => {
    if (typeof req.body[field] !== 'undefined') {
      updates[field] = req.body[field];
    }
  });

  if (!Object.keys(updates).length) {
    return next(new ApiError(400, 'No valid fields provided'));
  }

  const group = await Group.findOneAndUpdate(
    { _id: req.params.groupId, coachId: req.user.id },
    updates,
    { new: true, runValidators: true }
  );

  if (!group) {
    return next(new ApiError(404, 'Group not found'));
  }

  res.json(group);
});

const deleteGroup = catchAsync(async (req, res, next) => {
  const group = await Group.findOneAndDelete({ _id: req.params.groupId, coachId: req.user.id });

  if (!group) {
    return next(new ApiError(404, 'Group not found'));
  }

  const playerIds = await Player.find({ groupId: group._id }).distinct('_id');

  await Promise.all([
    Player.deleteMany({ groupId: group._id }),
    Payment.deleteMany({ playerId: { $in: playerIds } }),
    Attendance.deleteMany({ groupId: group._id }),
  ]);

  res.json({ message: 'Group deleted successfully' });
});

module.exports = {
  listGroups,
  createGroup,
  getGroupDetails,
  updateGroup,
  deleteGroup,
};

