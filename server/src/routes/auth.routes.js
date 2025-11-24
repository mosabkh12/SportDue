const express = require('express');
const { registerCoach, coachLogin, adminLogin, playerLogin } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/coach/register', registerCoach);
router.post('/coach/login', coachLogin);
router.post('/admin/login', adminLogin);
router.post('/player/login', playerLogin);

module.exports = router;

