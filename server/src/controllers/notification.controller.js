const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const { sendPaymentReminder } = require('../services/smsService');
const { ensurePlayerOwnership, ensureGroupOwnership } = require('../utils/ownership');
const Player = require('../models/player.model');
const Payment = require('../models/payment.model');
const Group = require('../models/group.model');
const { PAYMENT_STATUS } = require('../config/constants');

const sendPaymentReminderController = catchAsync(async (req, res, next) => {
  const { playerId, month, customMessage } = req.body;

  if (!playerId) {
    return next(new ApiError(400, 'playerId is required'));
  }

  const player = await ensurePlayerOwnership(playerId, req.user.id);

  const message =
    customMessage ||
    `Hi ${player.fullName.split(' ')[0]}, payment reminder from CoachPay. Your payment for ${month || 'this month'} is due. Please pay soon. Thank you! -CoachPay`;

  await sendPaymentReminder(player.phone, message);

  res.json({ success: true });
});

const sendGroupPaymentRemindersController = catchAsync(async (req, res, next) => {
  const { groupId, month, customMessage } = req.body;

  if (!groupId || !month) {
    return next(new ApiError(400, 'groupId and month are required (format: YYYY-MM)'));
  }

  // Ensure coach owns the group
  const group = await ensureGroupOwnership(groupId, req.user.id);

  // Get all players in the group
  const players = await Player.find({ groupId });

  if (players.length === 0) {
    return res.json({ success: true, sent: 0, message: 'No players in this group' });
  }

  const playerIds = players.map((p) => p._id);

  // Find payments for this month - get unpaid or partially paid players
  const payments = await Payment.find({
    playerId: { $in: playerIds },
    month,
    status: { $in: [PAYMENT_STATUS.UNPAID, PAYMENT_STATUS.PARTIAL] },
  });

  const paidPlayerIds = new Set(payments.map((p) => String(p.playerId)));

  // Find players who haven't paid or are partially paid
  const unpaidPlayers = players.filter((player) => {
    const payment = payments.find((p) => String(p.playerId) === String(player._id));
    return !payment || payment.status !== PAYMENT_STATUS.PAID;
  });

  if (unpaidPlayers.length === 0) {
    return res.json({
      success: true,
      sent: 0,
      message: 'All players have paid for this month',
    });
  }

  // Format month for display (e.g., "2025-12" -> "December 2025")
  const [year, monthNum] = month.split('-');
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const monthDisplay = `${monthNames[parseInt(monthNum) - 1]} ${year}`;

  // Get payment due date
  const dueDate = group.paymentDueDay || 1;
  const dueDateDisplay = `${dueDate}${dueDate === 1 ? 'st' : dueDate === 2 ? 'nd' : dueDate === 3 ? 'rd' : 'th'}`;

  // Send reminders
  const results = await Promise.allSettled(
    unpaidPlayers.map(async (player) => {
      const payment = payments.find((p) => String(p.playerId) === String(player._id));
      const amountDue = payment ? payment.amountDue : player.monthlyFee;
      const amountPaid = payment ? payment.amountPaid : 0;
      const remaining = amountDue - amountPaid;

      const message =
        customMessage ||
        `Hi ${player.fullName.split(' ')[0]}, payment reminder from CoachPay. ${monthDisplay} payment due ${dueDateDisplay}. Amount: $${amountDue}, Paid: $${amountPaid}, Remaining: $${remaining}. Please pay soon. Thank you! -CoachPay`;

      await sendPaymentReminder(player.phone, message);
      return { playerId: player._id, playerName: player.fullName, phone: player.phone };
    })
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  res.json({
    success: true,
    sent: successful,
    failed,
    total: unpaidPlayers.length,
    month: monthDisplay,
    details: results.map((r) =>
      r.status === 'fulfilled' ? { ...r.value, success: true } : { error: r.reason.message, success: false }
    ),
  });
});

module.exports = {
  sendPaymentReminderController,
  sendGroupPaymentRemindersController,
};



