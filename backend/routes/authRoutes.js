const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
  googleAuth,
  resendVerification,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/verify/:token', verifyEmail);
router.post('/google', googleAuth);
router.post('/resend-verification', resendVerification);

module.exports = router;