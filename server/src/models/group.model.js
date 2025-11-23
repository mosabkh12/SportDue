const { Schema, model, Types } = require('mongoose');

const groupSchema = new Schema(
  {
    coachId: { type: Types.ObjectId, ref: 'Coach', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    defaultMonthlyFee: { type: Number, default: 0 },
    paymentDueDay: { type: Number, min: 1, max: 31, default: 1 }, // Day of month (1-31) when payment is due
  },
  { timestamps: true }
);

module.exports = model('Group', groupSchema);



