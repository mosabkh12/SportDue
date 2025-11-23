const express = require('express');
const { registerCoach, coachLogin, adminLogin } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/coach/register', registerCoach);
router.post('/coach/login', coachLogin);
router.post('/admin/login', adminLogin);

module.exports = router;

