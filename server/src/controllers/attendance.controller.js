const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const Player = require('../models/player.model');
const Attendance = require('../models/attendance.model');
const { ensureGroupOwnership } = require('../utils/ownership');

const normalizeDate = (date) => {
  const normalized = new Date(date);
  if (Number.isNaN(normalized.getTime())) {
    throw new ApiError(400, 'Invalid date provided');
  }
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const getAttendanceForGroup = catchAsync(async (req, res) => {
  const { date } = req.query;
  if (!date) {
    throw new ApiError(400, 'Date query parameter is required');
  }

  await ensureGroupOwnership(req.params.groupId, req.user.id);
  const targetDate = normalizeDate(date);

  const records = await Attendance.find({
    groupId: req.params.groupId,
    date: targetDate,
  });

  res.json(records);
});

const markAttendance = catchAsync(async (req, res) => {
  const { groupId, date, records } = req.body;

  if (!groupId || !date || !Array.isArray(records)) {
    throw new ApiError(400, 'groupId, date, and records array are required');
  }

  await ensureGroupOwnership(groupId, req.user.id);
  const targetDate = normalizeDate(date);

  const playerIds = records.map((record) => record.playerId);
  const validPlayers = await Player.find({
    _id: { $in: playerIds },
    groupId,
  }).select('_id');

  const validIds = new Set(validPlayers.map((p) => String(p._id)));

  const operations = records
    .filter((record) => validIds.has(String(record.playerId)))
    .map((record) =>
      Attendance.findOneAndUpdate(
        { playerId: record.playerId, date: targetDate },
        {
          playerId: record.playerId,
          groupId,
          date: targetDate,
          isPresent: !!record.isPresent,
          signature: record.signature || null,
        },
        { upsert: true, new: true }
      )
    );

  const results = await Promise.all(operations);

  res.json(results);
});

module.exports = {
  getAttendanceForGroup,
  markAttendance,
};

