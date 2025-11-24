const express = require('express');
const {
  getAdminProfile,
  updateAdminProfile,
  listCoaches,
  toggleCoachStatus,
  getCoachSummaryDetails,
  createCoach,
  updateCoach,
  deleteCoach,
  getCoachGroupsAndPlayers,
} = require('../controllers/admin.controller');
const { authenticate, requireRole, USER_ROLES } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole(USER_ROLES.ADMIN));

router.get('/me', getAdminProfile);
router.put('/me', updateAdminProfile);
router.get('/coaches', listCoaches);
router.post('/coaches', createCoach);
// Specific routes must come before general :coachId routes
router.get('/coaches/:coachId/summary', getCoachSummaryDetails);
router.get('/coaches/:coachId/groups-players', getCoachGroupsAndPlayers);
router.patch('/coaches/:coachId/toggle-active', toggleCoachStatus);
router.put('/coaches/:coachId', updateCoach);
router.delete('/coaches/:coachId', deleteCoach);

module.exports = router;

