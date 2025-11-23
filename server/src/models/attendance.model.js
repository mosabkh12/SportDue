const { Schema, model, Types } = require('mongoose');

const attendanceSchema = new Schema(
  {
    playerId: { type: Types.ObjectId, ref: 'Player', required: true },
    groupId: { type: Types.ObjectId, ref: 'Group', required: true },
    date: { type: Date, required: true },
    isPresent: { type: Boolean, default: false },
    signature: { type: String, default: null },
  },
  { timestamps: true }
);

attendanceSchema.index({ playerId: 1, date: 1 }, { unique: true });

module.exports = model('Attendance', attendanceSchema);



