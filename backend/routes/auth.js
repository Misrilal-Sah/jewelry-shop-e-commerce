const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadProfileImage: uploadProfileImageMiddleware } = require('../middleware/uploadMiddleware');
const {
  register,
  login,
  getProfile,
  updateProfile,
  uploadProfileImage,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  sendSignupOTP,
  verifySignupOTP,
  sendResetOTP,
  verifyResetOTP,
  resetPassword,
  changePassword,
  sendEmailChangeOTP,
  verifyEmailChange,
  googleAuth,
  getSpecialDates,
  updateSpecialDates
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// OTP routes (public)
router.post('/send-signup-otp', sendSignupOTP);
router.post('/verify-signup-otp', verifySignupOTP);
router.post('/send-reset-otp', sendResetOTP);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/profile/image', authMiddleware, uploadProfileImageMiddleware, uploadProfileImage);
router.put('/change-password', authMiddleware, changePassword);
router.post('/send-email-change-otp', authMiddleware, sendEmailChangeOTP);
router.post('/verify-email-change', authMiddleware, verifyEmailChange);
router.get('/addresses', authMiddleware, getAddresses);
router.post('/addresses', authMiddleware, addAddress);
router.put('/addresses/:id', authMiddleware, updateAddress);
router.delete('/addresses/:id', authMiddleware, deleteAddress);
router.put('/addresses/:id/default', authMiddleware, setDefaultAddress);

// Special dates (birthday/anniversary)
router.get('/special-dates', authMiddleware, getSpecialDates);
router.put('/special-dates', authMiddleware, updateSpecialDates);

module.exports = router;
