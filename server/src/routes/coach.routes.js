const express = require('express');
const { authenticate, requireRole, USER_ROLES } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getCoachPaymentSummary,
} = require('../controllers/coach.controller');

const router = express.Router();

router.use(authenticate, requireRole(USER_ROLES.COACH));

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.get('/payments/summary', getCoachPaymentSummary);

module.exports = router;

