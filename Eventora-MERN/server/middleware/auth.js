const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            if (req.user.isBlocked) {
                return res.status(403).json({ message: 'Your account is blocked' });
            }
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (req.user?.role === 'organizer' && !req.user.organizerApproved) {
        return res.status(403).json({ message: 'Organizer account is awaiting admin approval' });
    }
    if (req.user && roles.includes(req.user.role)) return next();
    return res.status(403).json({ message: 'You do not have permission for this action' });
};

module.exports = { protect, admin, authorize };
