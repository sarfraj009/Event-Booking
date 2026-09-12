const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const { sendBookingEmail, sendOTPEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendBookingOTP = async (req, res) => {
    try {
        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
        await OTP.create({ email: req.user.email, otp, action: 'event_booking' });
        await sendOTPEmail(req.user.email, otp, 'event_booking');
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp, quantity = 1 } = req.body;
        const ticketQuantity = Number(quantity);

        const maxTicketsPerBooking = Number(process.env.MAX_TICKETS_PER_BOOKING || 50);
        if (!Number.isInteger(ticketQuantity) || ticketQuantity < 1 || ticketQuantity > maxTicketsPerBooking) {
            return res.status(400).json({ message: `Quantity must be a whole number between 1 and ${maxTicketsPerBooking}` });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.availableSeats < ticketQuantity) return res.status(409).json({ message: 'Not enough seats available' });

        // Verify OTP explicitly before proceeding
        const validOTP = await OTP.findOne({ email: req.user.email, otp, action: 'event_booking' });
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }

        const existingBooking = await Booking.findOne({ userId: req.user.id, eventId });
        if (existingBooking && existingBooking.status !== 'cancelled') {
            return res.status(400).json({ message: 'Already booked or pending' });
        }

        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: 'pending',
            paymentStatus: 'not_paid',
            organizerId: event.createdBy,
            quantity: ticketQuantity,
            amount: event.ticketPrice * ticketQuantity,
            paymentStatus: event.ticketPrice === 0 ? 'successful' : 'pending',
            ticketNumber: Math.floor(100000 + Math.random() * 900000)
        });

        await OTP.deleteOne({ _id: validOTP._id }); // cleanup

        res.status(201).json({ message: 'Booking request submitted', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const { paymentStatus } = req.body; // 'paid' or 'not_paid'
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (req.user.role === 'organizer' && booking.eventId.createdBy?.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only confirm bookings for your own events' });
        }

        if (booking.status === 'confirmed') return res.status(400).json({ message: 'Booking is already confirmed' });

        const event = await Event.findByIdAndUpdate(
            booking.eventId._id,
            { $inc: { availableSeats: -(booking.quantity || 1) } },
            { new: true, runValidators: true }
        );
        if (!event || event.availableSeats < 0) {
            if (event) await Event.updateOne({ _id: event._id }, { $inc: { availableSeats: booking.quantity || 1 } });
            return res.status(409).json({ message: 'Not enough seats available to confirm this booking' });
        }

        booking.status = 'confirmed';
        booking.paymentStatus = paymentStatus === 'paid' ? 'successful' : (paymentStatus || booking.paymentStatus);
        await booking.save();

        // Send email on admin confirmation
        await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title);

        res.json({ message: 'Booking confirmed successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('eventId')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id }).populate('eventId').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        const wasConfirmed = booking.status === 'confirmed';

        booking.status = 'cancelled';
        await booking.save();

        // Only restore the seat if it was actually confirmed and deducted
        if (wasConfirmed) {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats = Math.min(event.totalSeats, event.availableSeats + (booking.quantity || 1));
                await event.save();
            }
        }
        booking.cancellationDate = new Date();
        await booking.save();

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can permanently delete bookings' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'confirmed') {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats = Math.min(event.totalSeats, event.availableSeats + (booking.quantity || 1));
                await event.save();
            }
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.json({ message: 'Booking deleted permanently' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cleanupCancelledBookings = async () => {
    try {
        const days = Number(process.env.CANCELLED_BOOKING_DELETE_DAYS || 7);
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const result = await Booking.deleteMany({
            status: 'cancelled',
            cancellationDate: { $lt: cutoffDate }
        });

        if (result.deletedCount > 0) {
            console.log(`Deleted ${result.deletedCount} cancelled booking(s) older than ${days} days`);
        } else {
            console.log(`Cleanup check complete: no cancelled booking older than ${days} days found.`);
        }
    } catch (error) {
        console.error('Cancelled booking cleanup failed:', error.message);
    }
};

exports.rateBooking = async (req, res) => {
    try {
        const { rating, review = '' } = req.body;
        const value = Number(rating);
        const reviewText = typeof review === 'string' ? review.trim().slice(0, 250) : '';

        if (!Number.isInteger(value) || value < 1 || value > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const booking = await Booking.findOne({ _id: req.params.id, userId: req.user._id });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (!['confirmed', 'completed'].includes(booking.status)) {
            return res.status(400).json({ message: 'Only confirmed or completed bookings can be reviewed.' });
        }

        booking.rating = value;
        booking.review = reviewText;
        await booking.save();

        res.json({ message: 'Rating submitted successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
