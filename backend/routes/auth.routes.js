const express = require('express');
const router = express.Router();
const { loginDoctor, getMe, verifyPassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/login', loginDoctor);
router.get('/me', protect, getMe);
router.post('/verify', protect, verifyPassword);

module.exports = router;
