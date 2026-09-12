const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    quantity: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending', 'completed'], default: 'pending' },
    paymentStatus: { type: String, enum: ['pending', 'successful', 'failed', 'refunded', 'not_paid', 'paid'], default: 'pending' },
    amount: { type: Number, required: true },
    paymentId: String,
    orderId: String,
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, default: '' },
    cancellationDate: Date,
    bookedAt: { type: Date, default: Date.now }
}, { timestamps: true });

bookingSchema.index({ userId: 1, eventId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
