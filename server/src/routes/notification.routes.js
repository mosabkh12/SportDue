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

// Add endpoint to test automatic reminders (for testing purposes)
router.post('/test-automatic-reminders', async (req, res, next) => {
  const { sendAutomaticPaymentReminders } = require('../services/schedulerService');
  try {
    await sendAutomaticPaymentReminders();
    res.json({ success: true, message: 'Automatic reminders test completed. Check server logs for details.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;



