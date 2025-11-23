const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth.routes');
const coachRoutes = require('./routes/coach.routes');
const groupRoutes = require('./routes/group.routes');
const playerRoutes = require('./routes/player.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : undefined;

app.use(
  cors({
    origin: allowedOrigins || '*',
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

module.exports = app;

