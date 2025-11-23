const express = require('express');
const {
  getAdminProfile,
  updateAdminProfile,
  listCoaches,
  toggleCoachStatus,
  getCoachSummaryDetails,
} = require('../controllers/admin.controller');
const { authenticate, requireRole, USER_ROLES } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole(USER_ROLES.ADMIN));

router.get('/me', getAdminProfile);
router.put('/me', updateAdminProfile);
router.get('/coaches', listCoaches);
router.get('/coaches/:coachId/summary', getCoachSummaryDetails);
router.patch('/coaches/:coachId/toggle-active', toggleCoachStatus);

module.exports = router;

