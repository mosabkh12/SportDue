const ApiError = require('../utils/apiError');
const catchAsync = require('../utils/catchAsync');
const Payment = require('../models/payment.model');
const { PAYMENT_STATUS } = require('../config/constants');
const { ensurePlayerOwnership } = require('../utils/ownership');

const listPlayerPayments = catchAsync(async (req, res) => {
  await ensurePlayerOwnership(req.params.playerId, req.user.id);
  const payments = await Payment.find({ playerId: req.params.playerId }).sort({ month: -1 });
  res.json(payments);
});

const createOrUpdatePayment = catchAsync(async (req, res, next) => {
  const { month, amountPaid = 0, amountDue } = req.body;

  if (!month) {
    return next(new ApiError(400, 'Month is required'));
  }

  const player = await ensurePlayerOwnership(req.params.playerId, req.user.id);
  const targetAmountDue = typeof amountDue === 'number' ? amountDue : player.monthlyFee;

  const payment = await Payment.findOneAndUpdate(
    { playerId: player._id, month },
    {
      $setOnInsert: { amountDue: targetAmountDue },
      $inc: { amountPaid },
    },
    { new: true, upsert: true }
  );

  let status = PAYMENT_STATUS.UNPAID;
  if (payment.amountPaid >= targetAmountDue) {
    status = PAYMENT_STATUS.PAID;
  } else if (payment.amountPaid > 0) {
    status = PAYMENT_STATUS.PARTIAL;
  }

  payment.status = status;
  payment.amountDue = targetAmountDue;
  await payment.save();

  res.json(payment);
});

module.exports = {
  listPlayerPayments,
  createOrUpdatePayment,
};



