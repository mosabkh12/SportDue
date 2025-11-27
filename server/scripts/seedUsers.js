require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Admin = require('../src/models/admin.model');
const Coach = require('../src/models/coach.model');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@sportdue.test';
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME || 'sportdue-admin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'AdminPass123';
const COACH_EMAIL = process.env.SEED_COACH_EMAIL || 'coach@sportdue.test';
const COACH_USERNAME = process.env.SEED_COACH_USERNAME || 'sportdue-coach';
const COACH_PASSWORD = process.env.SEED_COACH_PASSWORD || 'CoachPass123';

const seedUsers = async () => {
  await connectDB();

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const coachHash = await bcrypt.hash(COACH_PASSWORD, 10);

  const admin = await Admin.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      username: ADMIN_USERNAME.toLowerCase(),
      email: ADMIN_EMAIL,
      password: adminHash,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const coach = await Coach.findOneAndUpdate(
    { email: COACH_EMAIL },
    {
      username: COACH_USERNAME.toLowerCase(),
      email: COACH_EMAIL,
      password: coachHash,
      phone: '+15555550123',
      isActive: true,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log('Seed complete:');
  console.log(` Admin -> ${admin.email} (username: ${admin.username}) / ${ADMIN_PASSWORD}`);
  console.log(` Coach -> ${coach.email} (username: ${coach.username}) / ${COACH_PASSWORD}`);

  await mongoose.connection.close();
};

seedUsers()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

