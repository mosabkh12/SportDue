const { Schema, model, Types } = require('mongoose');

const playerSchema = new Schema(
  {
    groupId: { type: Types.ObjectId, ref: 'Group', required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    monthlyFee: { type: Number, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = model('Player', playerSchema);



