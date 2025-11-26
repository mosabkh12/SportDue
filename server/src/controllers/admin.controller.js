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
        sportType: coach.sportType,
        isActive: coach.isActive,
        displayPassword: coach.displayPassword, // Include display password
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
      sportType: coach.sportType,
      isActive: coach.isActive,
    },
    summary,
  });
});

const createCoach = catchAsync(async (req, res, next) => {
  const { username, email, password, phone, sportType } = req.body;

  if (!username || !email || !password || !phone || !sportType) {
    return next(new ApiError(400, 'Username, email, password, phone, and sport type are required'));
  }

  // Validate phone number length
  if (phone && phone.trim().length > 20) {
    return next(new ApiError(400, 'Phone number must be 20 characters or less'));
  }

  if (!['basketball', 'football'].includes(sportType)) {
    return next(new ApiError(400, 'Sport type must be either "basketball" or "football"'));
  }

  const normalizedUsername = username.toLowerCase();
  const existing = await Coach.findOne({
    $or: [{ email: email.toLowerCase() }, { username: normalizedUsername }],
  });

  if (existing) {
    return next(new ApiError(409, 'A coach with this email or username already exists'));
  }

  const coach = await Coach.create({
    username: normalizedUsername,
    email,
    password,
    phone,
    sportType,
    isActive: true,
  });

  // Reload coach to get displayPassword after pre-save hook
  const savedCoach = await Coach.findById(coach._id);
  const summary = await getCoachSummary(coach._id);

  res.status(201).json({
    id: savedCoach._id,
    username: savedCoach.username,
    email: savedCoach.email,
    phone: savedCoach.phone,
    sportType: savedCoach.sportType,
    isActive: savedCoach.isActive,
    displayPassword: savedCoach.displayPassword, // Include display password
    ...summary,
  });
});

const updateCoach = catchAsync(async (req, res, next) => {
  const { coachId } = req.params;
  const { username, email, phone, sportType, password } = req.body;

  const coach = await Coach.findById(coachId);
  if (!coach) {
    return next(new ApiError(404, 'Coach not found'));
  }

  let hasUpdates = false;

  if (username && username.trim()) {
    const normalizedUsername = username.toLowerCase();
    if (normalizedUsername !== coach.username) {
      const existing = await Coach.findOne({
        _id: { $ne: coach._id },
        username: normalizedUsername,
      });
      if (existing) {
        return next(new ApiError(409, 'Username already in use'));
      }
      coach.username = normalizedUsername;
      hasUpdates = true;
    }
  }

  if (email && email.trim()) {
    const normalizedEmail = email.toLowerCase();
    if (normalizedEmail !== coach.email) {
      const existing = await Coach.findOne({
        _id: { $ne: coach._id },
        email: normalizedEmail,
      });
      if (existing) {
        return next(new ApiError(409, 'Email already in use'));
      }
      coach.email = normalizedEmail;
      hasUpdates = true;
    }
  }

  if (phone && phone !== coach.phone) {
    // Validate phone number length
    if (phone.trim().length > 20) {
      return next(new ApiError(400, 'Phone number must be 20 characters or less'));
    }
    coach.phone = phone;
    hasUpdates = true;
  }

  if (sportType) {
    if (!['basketball', 'football'].includes(sportType)) {
      return next(new ApiError(400, 'Sport type must be either "basketball" or "football"'));
    }
    if (sportType !== coach.sportType) {
      coach.sportType = sportType;
      hasUpdates = true;
    }
  }

  if (password && password.trim()) {
    coach.password = password;
    coach.displayPassword = password; // Store plain text password before hashing
    hasUpdates = true;
  }

  if (!hasUpdates) {
    return next(new ApiError(400, 'No valid fields provided'));
  }

  await coach.save();

  // Reload coach to get displayPassword after pre-save hook
  const savedCoach = await Coach.findById(coach._id);
  const summary = await getCoachSummary(coach._id);

  res.json({
    id: savedCoach._id,
    username: savedCoach.username,
    email: savedCoach.email,
    phone: savedCoach.phone,
    sportType: savedCoach.sportType,
    isActive: savedCoach.isActive,
    displayPassword: savedCoach.displayPassword, // Include display password
    ...summary,
  });
});

const deleteCoach = catchAsync(async (req, res, next) => {
  const { coachId } = req.params;

  const coach = await Coach.findById(coachId);
  if (!coach) {
    return next(new ApiError(404, 'Coach not found'));
  }

  // Delete associated groups and players
  const Group = require('../models/group.model');
  const Player = require('../models/player.model');
  const Payment = require('../models/payment.model');
  const Attendance = require('../models/attendance.model');

  const groups = await Group.find({ coachId: coach._id });
  const groupIds = groups.map((g) => g._id);
  const playerIds = await Player.find({ groupId: { $in: groupIds } }).distinct('_id');

  // Delete all related data
  await Promise.all([
    Player.deleteMany({ groupId: { $in: groupIds } }),
    Payment.deleteMany({ playerId: { $in: playerIds } }),
    Attendance.deleteMany({ groupId: { $in: groupIds } }),
    Group.deleteMany({ coachId: coach._id }),
    Coach.findByIdAndDelete(coach._id),
  ]);

  res.json({ message: 'Coach and all associated data deleted successfully' });
});

const getCoachGroupsAndPlayers = catchAsync(async (req, res, next) => {
  const { coachId } = req.params;

  const coach = await Coach.findById(coachId);
  if (!coach) {
    return next(new ApiError(404, 'Coach not found'));
  }

  const Group = require('../models/group.model');
  const Player = require('../models/player.model');

  // Get all groups for this coach
  const groups = await Group.find({ coachId: coach._id }).sort({ createdAt: -1 });

  // Get all players for each group
  const groupsWithPlayers = await Promise.all(
    groups.map(async (group) => {
      const players = await Player.find({ groupId: group._id })
        .select('fullName phone monthlyFee username displayPassword createdAt')
        .sort({ createdAt: -1 });
      
      return {
        id: group._id,
        name: group.name,
        description: group.description,
        defaultMonthlyFee: group.defaultMonthlyFee,
        paymentDueDay: group.paymentDueDay,
        createdAt: group.createdAt,
        playerCount: players.length,
        players: players.map(player => ({
          id: player._id,
          fullName: player.fullName,
          phone: player.phone,
          monthlyFee: player.monthlyFee,
          username: player.username,
          displayPassword: player.displayPassword,
          createdAt: player.createdAt,
        })),
      };
    })
  );

  res.json({
    coach: {
      id: coach._id,
      username: coach.username,
      email: coach.email,
      sportType: coach.sportType,
    },
    groups: groupsWithPlayers,
  });
});

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  listCoaches,
  toggleCoachStatus,
  getCoachSummaryDetails,
  createCoach,
  updateCoach,
  deleteCoach,
  getCoachGroupsAndPlayers,
};

