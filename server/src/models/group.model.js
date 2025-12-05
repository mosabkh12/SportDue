const { Schema, model, Types } = require('mongoose');

const groupSchema = new Schema(
  {
    coachId: { type: Types.ObjectId, ref: 'Coach', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    defaultMonthlyFee: { type: Number, default: 0 },
    paymentDueDay: { type: Number, min: 1, max: 31, default: 1 }, // Day of month (1-31) when payment is due
    trainingDays: { 
      type: [Number], 
      default: [], 
      validate: {
        validator: function(arr) {
          return arr.every(day => day >= 0 && day <= 6); // 0 = Sunday, 6 = Saturday
        },
        message: 'Training days must be numbers between 0 (Sunday) and 6 (Saturday)'
      }
    }, // Days of the week when training occurs (0=Sunday, 1=Monday, ..., 6=Saturday)
    trainingTime: {
      startTime: { type: String, default: '18:00' }, // Format: HH:MM
      endTime: { type: String, default: '19:30' }, // Format: HH:MM
    }, // Training session time
    cancelledDates: {
      type: [String],
      default: [],
    }, // Array of cancelled dates in YYYY-MM-DD format
    addedDates: {
      type: [String],
      default: [],
    }, // Array of added replacement dates in YYYY-MM-DD format
    dateTimes: {
      type: Schema.Types.Mixed,
      default: {},
    }, // Custom times for specific dates (e.g., { "2025-12-15": { startTime: "17:00", endTime: "18:30" } })
  },
  { timestamps: true }
);

module.exports = model('Group', groupSchema);



