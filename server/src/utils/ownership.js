const ApiError = require('./apiError');
const Group = require('../models/group.model');
const Player = require('../models/player.model');

const ensureGroupOwnership = async (groupId, coachId) => {
  const group = await Group.findOne({ _id: groupId, coachId });
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }
  return group;
};

const ensurePlayerOwnership = async (playerId, coachId) => {
  const player = await Player.findById(playerId).populate('groupId');
  if (!player || String(player.groupId.coachId) !== String(coachId)) {
    throw new ApiError(404, 'Player not found');
  }
  return player;
};

module.exports = {
  ensureGroupOwnership,
  ensurePlayerOwnership,
};



