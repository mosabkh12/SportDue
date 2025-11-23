const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../config/constants');

const coachSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.COACH },
  },
  { timestamps: true }
);

const ensureUsername = function ensureUsername(doc) {
  if (!doc.username && doc.email) {
    const base = doc.email.split('@')[0];
    doc.username = `${base}-${doc._id.toString().slice(-4)}`.toLowerCase();
  }
};

coachSchema.pre('validate', function ensureCoachUsername() {
  ensureUsername(this);
});

coachSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

coachSchema.methods.comparePassword = function comparePassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = model('Coach', coachSchema);

