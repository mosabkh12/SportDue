const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const generateToken = require('../utils/generateToken');
const Coach = require('../models/coach.model');
const Admin = require('../models/admin.model');
const { USER_ROLES } = require('../config/constants');

const sanitizeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const registerCoach = catchAsync(async (req, res, next) => {
  const { username, email, password, phone } = req.body;

  if (!username || !email || !password || !phone) {
    return next(new ApiError(400, 'Username, email, password, and phone are required'));
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
  });
  const token = generateToken({ id: coach._id, role: USER_ROLES.COACH });

  res.status(201).json({
    token,
    coach: sanitizeUser(coach),
  });
});

const coachLogin = catchAsync(async (req, res, next) => {
  const identifier =
    (req.body.identifier || req.body.email || req.body.username || '').toLowerCase();
  const { password } = req.body;

  if (!identifier || !password) {
    return next(new ApiError(400, 'Identifier (email or username) and password are required'));
  }

  const coach = await Coach.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });
  if (!coach) {
    return next(new ApiError(401, 'Invalid credentials'));
  }

  if (!coach.isActive) {
    return next(new ApiError(403, 'Coach account is inactive'));
  }

  const isMatch = await coach.comparePassword(password);

  if (!isMatch) {
    return next(new ApiError(401, 'Invalid credentials'));
  }

  const token = generateToken({ id: coach._id, role: USER_ROLES.COACH });

  res.json({
    token,
    coach: sanitizeUser(coach),
  });
});

const adminLogin = catchAsync(async (req, res, next) => {
  const identifier =
    (req.body.identifier || req.body.email || req.body.username || '').toLowerCase();
  const { password } = req.body;

  if (!identifier || !password) {
    return next(new ApiError(400, 'Identifier (email or username) and password are required'));
  }

  const admin = await Admin.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });
  if (!admin) {
    return next(new ApiError(401, 'Invalid credentials'));
  }

  const isMatch = await admin.comparePassword(password);

  if (!isMatch) {
    return next(new ApiError(401, 'Invalid credentials'));
  }

  const token = generateToken({ id: admin._id, role: USER_ROLES.ADMIN });

  res.json({
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      username: admin.username,
      email: admin.email,
      role: USER_ROLES.ADMIN,
    },
  });
});

module.exports = {
  registerCoach,
  coachLogin,
  adminLogin,
};

