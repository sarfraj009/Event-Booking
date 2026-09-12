const User = require('../models/User');
const Event = require('../models/Event');
const bcrypt = require('bcryptjs');

exports.getOrganizers = async (req, res) => {
    try {
        const organizers = await User.find({ role: 'organizer' }).select('-password').sort({ createdAt: -1 });
        res.json(organizers);
    } catch (error) {
        res.status(500).json({ message: 'Unable to load organizers', error: error.message });
    }
};

exports.setOrganizerApproval = async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'organizer' },
            { organizerApproved: Boolean(req.body.approved) },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ message: 'Organizer not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Unable to update organizer approval', error: error.message });
    }
};

const publicUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    city: user.city || '',
    bio: user.bio || '',
    profileImage: user.profileImage || '',
    organizerApproved: user.organizerApproved
});

exports.getProfile = async (req, res) => {
    res.json(publicUser(req.user));
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, city, bio, profileImage } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (typeof name === 'string' && name.trim()) user.name = name.trim();
        if (typeof phone === 'string') user.phone = phone.trim();
        if (typeof city === 'string') user.city = city.trim();
        if (typeof bio === 'string') user.bio = bio.trim().slice(0, 500);
        if (typeof profileImage === 'string') user.profileImage = profileImage.trim();
        await user.save();
        res.json(publicUser(user));
    } catch (error) {
        res.status(500).json({ message: 'Unable to update profile', error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'Current password and a new password of at least 8 characters are required' });
        }
        const user = await User.findById(req.user.id);
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Unable to change password', error: error.message });
    }
};

exports.getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('wishlist');
        res.json(user?.wishlist || []);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.toggleWishlist = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const user = await User.findById(req.user.id);
        const isSaved = user.wishlist.some((id) => id.toString() === eventId);

        if (isSaved) {
            user.wishlist = user.wishlist.filter((id) => id.toString() !== eventId);
            event.wishlistCount = Math.max(0, Number(event.wishlistCount || 0) - 1);
        } else {
            user.wishlist.push(eventId);
            event.wishlistCount = Number(event.wishlistCount || 0) + 1;
        }

        await Promise.all([user.save(), event.save()]);

        res.json({
            message: isSaved ? 'Removed from wishlist' : 'Added to wishlist',
            isSaved: !isSaved,
            wishlist: user.wishlist,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
