const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const Player = require('../models/player.model');
const Payment = require('../models/payment.model');
const Attendance = require('../models/attendance.model');
const { ensureGroupOwnership, ensurePlayerOwnership } = require('../utils/ownership');
const generatePassword = require('../utils/generatePassword');
const { generateSimplePassword } = require('../utils/generatePassword');
const { USER_ROLES } = require('../config/constants');

const listGroupPlayers = catchAsync(async (req, res) => {
  await ensureGroupOwnership(req.params.groupId, req.user.id);
  const players = await Player.find({ groupId: req.params.groupId }).sort({ createdAt: -1 });
  // Include display passwords for all players
  const playersResponse = players.map(player => {
    const playerObj = player.toObject();
    if (player.displayPassword) {
      playerObj.displayPassword = player.displayPassword;
    }
    return playerObj;
  });
  res.json(playersResponse);
});

const addPlayer = catchAsync(async (req, res, next) => {
  const { fullName, phone, monthlyFee, notes } = req.body;

  if (!fullName || !phone || typeof monthlyFee === 'undefined') {
    return next(new ApiError(400, 'Full name, phone, and monthly fee are required'));
  }

  // Validate phone number length
  if (phone && phone.trim().length > 20) {
    return next(new ApiError(400, 'Phone number must be 20 characters or less'));
  }

  await ensureGroupOwnership(req.params.groupId, req.user.id);

  // Generate simple password based on player name (e.g., "mosab123")
  const tempPassword = generateSimplePassword(fullName, 8);
  
  // Generate username based on full name
  const namePart = fullName.toLowerCase().replace(/\s+/g, '').substring(0, 10); // Limit to 10 chars
  
  // Create player first to get the _id
  const tempPlayer = new Player({
    groupId: req.params.groupId,
    fullName,
    phone,
    monthlyFee,
    notes,
    password: tempPassword,
    role: USER_ROLES.PLAYER,
  });
  
  // Generate username with _id suffix
  const idPart = tempPlayer._id.toString().slice(-4);
  tempPlayer.username = `${namePart}${idPart}`;

  // Check if username already exists, if so append random numbers
  let existingPlayer = await Player.findOne({ username: tempPlayer.username });
  while (existingPlayer) {
    const randomPart = Math.floor(Math.random() * 100).toString();
    tempPlayer.username = `${namePart}${idPart}${randomPart}`;
    existingPlayer = await Player.findOne({ username: tempPlayer.username });
  }

  // Save the player (displayPassword will be set by pre-save hook)
  tempPlayer.displayPassword = tempPassword; // Explicitly set for display
  await tempPlayer.save();

  // Reload to get saved data
  const savedPlayer = await Player.findById(tempPlayer._id);

  // Return player data with displayPassword always included
  const playerResponse = savedPlayer.toObject();
  playerResponse.displayPassword = savedPlayer.displayPassword || tempPassword;
  playerResponse.credentials = {
    username: savedPlayer.username,
    password: savedPlayer.displayPassword || tempPassword,
  };

  res.status(201).json(playerResponse);
});

const getPlayerDetails = catchAsync(async (req, res) => {
  const player = await ensurePlayerOwnership(req.params.playerId, req.user.id);
  const playerResponse = player.toObject();
  // Always include displayPassword (will be null if not set)
  playerResponse.displayPassword = player.displayPassword || null;
  res.json(playerResponse);
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

  // Validate phone number length if being updated
  if (updates.phone && updates.phone.trim().length > 20) {
    return next(new ApiError(400, 'Phone number must be 20 characters or less'));
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

const resetPlayerPassword = catchAsync(async (req, res, next) => {
  const player = await ensurePlayerOwnership(req.params.playerId, req.user.id);
  
  // Generate simple password based on player name (e.g., "mosab123")
  const newPassword = generateSimplePassword(player.fullName, 8);
  
  // Generate username if it doesn't exist
  if (!player.username) {
    const namePart = player.fullName.toLowerCase().replace(/\s+/g, '').substring(0, 10);
    const idPart = player._id.toString().slice(-4);
    let baseUsername = `${namePart}${idPart}`;
    
    // Check if username already exists, if so append random characters
    let existingPlayer = await Player.findOne({ username: baseUsername, _id: { $ne: player._id } });
    let counter = 1;
    while (existingPlayer) {
      // Use simple lowercase letters and numbers for uniqueness
      const randomPart = Math.floor(Math.random() * 100).toString();
      baseUsername = `${namePart}${idPart}${randomPart}`;
      existingPlayer = await Player.findOne({ username: baseUsername, _id: { $ne: player._id } });
      counter++;
    }
    
    player.username = baseUsername;
  }
  
  // Set displayPassword and password explicitly
  player.displayPassword = newPassword;
  player.password = newPassword; // Pre-save hook will hash this
  player.role = USER_ROLES.PLAYER;
  
  // Save the player
  await player.save();
  
  // Reload player from database to get saved displayPassword
  const savedPlayer = await Player.findById(player._id);
  
  // Build response with displayPassword always included
  const playerResponse = savedPlayer.toObject();
  // Ensure displayPassword is in response (should be set, but guarantee it)
  playerResponse.displayPassword = savedPlayer.displayPassword || newPassword;
  
  res.json(playerResponse);
});

module.exports = {
  listGroupPlayers,
  addPlayer,
  getPlayerDetails,
  updatePlayer,
  deletePlayer,
  listPlayerAttendance,
  resetPlayerPassword,
};

