const express = require('express');
const {
  sendPaymentReminderController,
  sendGroupPaymentRemindersController,
} = require('../controllers/notification.controller');
const { authenticate, requireRole, USER_ROLES } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole(USER_ROLES.COACH));

router.post('/payment-reminder', sendPaymentReminderController);
router.post('/group-payment-reminders', sendGroupPaymentRemindersController);

module.exports = router;



