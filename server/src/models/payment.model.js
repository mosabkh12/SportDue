const { Schema, model, Types } = require('mongoose');
const { PAYMENT_STATUS } = require('../config/constants');

const paymentSchema = new Schema(
  {
    playerId: { type: Types.ObjectId, ref: 'Player', required: true },
    month: { type: String, required: true }, // format YYYY-MM
    amountDue: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ playerId: 1, month: 1 }, { unique: true });

module.exports = model('Payment', paymentSchema);



