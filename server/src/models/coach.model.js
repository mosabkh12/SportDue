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
    password: { type: String, required: true }, // Hashed password for authentication
    displayPassword: { type: String }, // Plain text password for display (stored for admin to view)
    phone: { type: String, required: true, maxlength: 20, trim: true },
    sportType: { 
      type: String, 
      enum: ['basketball', 'football'], 
      required: false 
    },
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
  // If password is being modified and it's not already hashed
  if (this.isModified('password') && this.password) {
    // Check if password is already hashed (bcrypt hash starts with $2a$ or $2b$)
    const isAlreadyHashed = this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$');
    
    if (!isAlreadyHashed) {
      // Store plain text password BEFORE hashing for display
      // Only set displayPassword if it's not already explicitly set
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

coachSchema.methods.comparePassword = function comparePassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = model('Coach', coachSchema);

