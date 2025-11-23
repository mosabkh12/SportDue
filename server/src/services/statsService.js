const { Types } = require('mongoose');
const Group = require('../models/group.model');
const Player = require('../models/player.model');
const Payment = require('../models/payment.model');

const getCoachSummary = async (coachId) => {
  const coachObjectId = typeof coachId === 'string' ? new Types.ObjectId(coachId) : coachId;

  const groups = await Group.find({ coachId: coachObjectId }).select('_id');
  const groupIds = groups.map((group) => group._id);

  const [playerCount, payments] = await Promise.all([
    groupIds.length ? Player.countDocuments({ groupId: { $in: groupIds } }) : 0,
    Payment.aggregate([
      {
        $lookup: {
          from: 'players',
          localField: 'playerId',
          foreignField: '_id',
          as: 'player',
        },
      },
      { $unwind: '$player' },
      {
        $match: {
          'player.groupId': { $in: groupIds },
        },
      },
      {
        $group: {
          _id: null,
          totalReceived: { $sum: '$amountPaid' },
          totalDue: { $sum: '$amountDue' },
        },
      },
    ]),
  ]);

  const totals = payments[0] || { totalReceived: 0, totalDue: 0 };

  return {
    groupCount: groups.length,
    playerCount,
    totalReceived: totals.totalReceived,
    totalDebt: totals.totalDue - totals.totalReceived,
  };
};

module.exports = {
  getCoachSummary,
};

