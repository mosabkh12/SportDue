const express = require('express');
const {
  getPlayerDetails,
  updatePlayer,
  deletePlayer,
  listPlayerAttendance,
  resetPlayerPassword,
} = require('../controllers/player.controller');
const {
  listPlayerPayments,
  createOrUpdatePayment,
} = require('../controllers/payment.controller');
const { authenticate, requireRole, USER_ROLES } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole(USER_ROLES.COACH));

// Specific routes should come before general :playerId route
router.route('/:playerId/payments').get(listPlayerPayments).post(createOrUpdatePayment);
router.route('/:playerId/attendance').get(listPlayerAttendance);
router.post('/:playerId/reset-password', resetPlayerPassword);
router.route('/:playerId').get(getPlayerDetails).put(updatePlayer).delete(deletePlayer);

module.exports = router;



