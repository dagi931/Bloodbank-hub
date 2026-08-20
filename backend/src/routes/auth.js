const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register-verify-email', authController.registerVerifyEmail);
router.post('/verify-code', authController.verifyCode);
router.post('/register-complete', authController.registerComplete);
router.post('/login', authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.get('/fayda-lookup/:faydaId', authController.faydaLookup);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password-donor', authController.resetPasswordDonor);

module.exports = router;

