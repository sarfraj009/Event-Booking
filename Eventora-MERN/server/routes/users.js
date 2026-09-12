const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getWishlist, toggleWishlist, getProfile, updateProfile, changePassword, getOrganizers, setOrganizerApproval } = require('../controllers/userController');

router.get('/organizers', protect, authorize('admin'), getOrganizers);
router.put('/organizers/:id/approval', protect, authorize('admin'), setOrganizerApproval);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:eventId', protect, toggleWishlist);

module.exports = router;
