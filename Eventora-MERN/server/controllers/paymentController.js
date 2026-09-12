const crypto = require('crypto');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Event = require('../models/Event');

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    : null;

exports.createOrder = async (req, res) => {
    try {
        if (!razorpay) return res.status(503).json({ message: 'Payment service is not configured' });
        const { eventId, quantity = 1 } = req.body;
        const ticketQuantity = Number(quantity);
        const event = await Event.findById(eventId);
        if (!event || event.status === 'cancelled') return res.status(404).json({ message: 'Event not found' });
        if (!Number.isInteger(ticketQuantity) || ticketQuantity < 1 || ticketQuantity > 20) return res.status(400).json({ message: 'Invalid quantity' });
        const amount = event.ticketPrice * ticketQuantity;
        const order = await razorpay.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `evt_${Date.now()}` });
        const booking = await Booking.create({
            userId: req.user.id, organizerId: event.createdBy, eventId, quantity: ticketQuantity,
            amount, orderId: order.id, paymentStatus: 'pending', status: 'pending'
        });
        res.status(201).json({ order, bookingId: booking._id, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        res.status(500).json({ message: 'Unable to create payment order' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature, bookingId } = req.body;
        const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`).digest('hex');
        const expectedBuffer = Buffer.from(expected);
        const signatureBuffer = Buffer.from(signature || '');
        if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
            await Booking.findOneAndUpdate({ _id: bookingId, userId: req.user.id }, { paymentStatus: 'failed' });
            return res.status(400).json({ message: 'Invalid payment signature' });
        }
        const booking = await Booking.findOne({ _id: bookingId, userId: req.user.id }).populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        const event = await Event.findOneAndUpdate(
            { _id: booking.eventId._id, availableSeats: { $gte: booking.quantity || 1 }, status: { $nin: ['cancelled', 'completed'] } },
            { $inc: { availableSeats: -(booking.quantity || 1) } }, { new: true }
        );
        if (!event) return res.status(409).json({ message: 'Not enough seats available' });
        booking.status = 'confirmed';
        booking.paymentStatus = 'successful';
        booking.paymentId = paymentId;
        await booking.save();
        res.json({ message: 'Payment verified and booking confirmed', booking });
    } catch (error) {
        res.status(500).json({ message: 'Payment verification failed' });
    }
};