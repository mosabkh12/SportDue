const express = require('express');
const { markAttendance, getAttendanceForGroup } = require('../controllers/attendance.controller');
const { authenticate, requireRole, USER_ROLES } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole(USER_ROLES.COACH));

router.post('/mark', markAttendance);
router.get('/group/:groupId', getAttendanceForGroup);

module.exports = router;



