const express = require('express');
const router = express.Router();
const { bookEvent, confirmBooking, getAllBookings, getMyBookings, cancelBooking, deleteBooking, sendBookingOTP, rateBooking } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/send-otp', protect, sendBookingOTP);
router.post('/', protect, bookEvent);
router.get('/', protect, authorize('admin', 'organizer'), getAllBookings);
router.put('/:id/confirm', protect, authorize('organizer', 'admin'), confirmBooking);
router.get('/my', protect, getMyBookings);
router.post('/:id/rating', protect, rateBooking);
router.delete('/:id', protect, cancelBooking);
router.delete('/:id/permanent', protect, authorize('admin'), deleteBooking);

module.exports = router;
