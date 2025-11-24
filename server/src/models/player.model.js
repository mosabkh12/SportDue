const { Schema, model, Types } = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../config/constants');

const playerSchema = new Schema(
  {
    groupId: { type: Types.ObjectId, ref: 'Group', required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    monthlyFee: { type: Number, required: true },
    notes: { type: String },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String }, // Hashed password for authentication
    displayPassword: { type: String }, // Plain text password for display (stored for coach/admin to view)
    role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.PLAYER },
  },
  { timestamps: true }
);

const ensureUsername = function ensureUsername(doc) {
  if (!doc.username && doc.fullName && doc.password) {
    // Generate username from full name + last 4 chars of _id
    const namePart = doc.fullName.toLowerCase().replace(/\s+/g, '');
    const idPart = doc._id ? doc._id.toString().slice(-4) : '0000';
    doc.username = `${namePart}${idPart}`.toLowerCase();
  }
};

playerSchema.pre('validate', function ensurePlayerUsername() {
  ensureUsername(this);
});

playerSchema.pre('save', async function hashPassword() {
  // If password is being modified and it's not already hashed
  if (this.isModified('password') && this.password) {
    // Check if password is already hashed (bcrypt hash starts with $2a$ or $2b$)
    const isAlreadyHashed = this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$');
    
    if (!isAlreadyHashed) {
      // Store plain text password BEFORE hashing for display
      // Only set displayPassword if it's not already explicitly set
      // If displayPassword was set manually, preserve it; otherwise use password
      if (!this.displayPassword) {
        this.displayPassword = this.password;
      }
      // Hash the password for secure authentication
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    // If password is already hashed, keep displayPassword as is (don't overwrite)
  }
});

playerSchema.methods.comparePassword = function comparePassword(enteredPassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = model('Player', playerSchema);



