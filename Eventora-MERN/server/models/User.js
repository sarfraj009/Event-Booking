const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'organizer', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    organizerApproved: { type: Boolean, default: false },
    phone: String,
    profileImage: String,
    city: String,
    bio: String,
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
