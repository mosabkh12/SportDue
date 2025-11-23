const express = require('express');
const {
  getPlayerDetails,
  updatePlayer,
  deletePlayer,
  listPlayerAttendance,
} = require('../controllers/player.controller');
const {
  listPlayerPayments,
  createOrUpdatePayment,
} = require('../controllers/payment.controller');
const { authenticate, requireRole, USER_ROLES } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole(USER_ROLES.COACH));

router.route('/:playerId').get(getPlayerDetails).put(updatePlayer).delete(deletePlayer);
router.route('/:playerId/payments').get(listPlayerPayments).post(createOrUpdatePayment);
router.route('/:playerId/attendance').get(listPlayerAttendance);

module.exports = router;



