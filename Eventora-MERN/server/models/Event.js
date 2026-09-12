const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    venueName: String,
    address: String,
    city: String,
    state: String,
    latitude: Number,
    longitude: Number,
    category: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    image: { type: String },
    ticketPrice: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'upcoming', 'ongoing', 'completed', 'cancelled'], default: 'published' },
    views: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

eventSchema.index({ title: 'text', description: 'text', location: 'text' });
eventSchema.index({ category: 1, date: 1, ticketPrice: 1 });

module.exports = mongoose.model('Event', eventSchema);
