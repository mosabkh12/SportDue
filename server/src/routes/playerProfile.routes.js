const express = require('express');
const {
  getMyProfile,
  getMyPayments,
  getMyAttendance,
  updateMyPassword,
} = require('../controllers/playerProfile.controller');
const { authenticate, requireRole, USER_ROLES } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole(USER_ROLES.PLAYER));

// Player self-access routes (uses req.user.id from JWT)
router.get('/me', getMyProfile);
router.put('/me/password', updateMyPassword);
router.get('/me/payments', getMyPayments);
router.get('/me/attendance', getMyAttendance);

module.exports = router;

