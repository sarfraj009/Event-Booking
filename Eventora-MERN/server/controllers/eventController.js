const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { uploadToCloudinary } = require('../utils/upload');

exports.getEvents = async (req, res) => {
    try {
        const filters = { status: { $nin: ['draft', 'cancelled'] } };
        if (req.query.category) filters.category = req.query.category;
        if (req.query.search) {
            const search = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filters.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        if (req.query.free === 'true') filters.ticketPrice = 0;
        if (req.query.free === 'false') filters.ticketPrice = { $gt: 0 };
        if (req.query.minPrice) filters.ticketPrice = { ...(filters.ticketPrice || {}), $gte: Number(req.query.minPrice) };
        if (req.query.maxPrice) filters.ticketPrice = { ...(filters.ticketPrice || {}), $lte: Number(req.query.maxPrice) };
        if (req.query.from || req.query.to) filters.date = {};
        if (req.query.from) filters.date.$gte = new Date(req.query.from);
        if (req.query.to) filters.date.$lte = new Date(req.query.to);
        if (req.query.upcoming === 'true') filters.date = { $gte: new Date() };

        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
        const sort = req.query.sort === 'priceAsc' ? { ticketPrice: 1 } :
            req.query.sort === 'priceDesc' ? { ticketPrice: -1 } :
                req.query.sort === 'popular' ? { views: -1, wishlistCount: -1 } : { date: 1 };
        const [events, total] = await Promise.all([
            Event.find(filters).sort(sort).skip((page - 1) * limit).limit(limit).populate('createdBy', 'name email'),
            Event.countDocuments(filters)
        ]);

        const eventIds = events.map((event) => event._id);
        const ratingSummary = await Booking.aggregate([
            { $match: { eventId: { $in: eventIds }, rating: { $ne: null } } },
            { $group: { _id: '$eventId', averageRating: { $avg: '$rating' }, ratingCount: { $sum: 1 } } }
        ]);

        const ratingMap = ratingSummary.reduce((acc, item) => {
            acc[item._id.toString()] = {
                averageRating: Number(item.averageRating.toFixed(1)),
                ratingCount: item.ratingCount
            };
            return acc;
        }, {});

        const responseEvents = events.map((event) => {
            const eventObject = event.toObject ? event.toObject() : event;
            const summary = ratingMap[event._id.toString()] || { averageRating: 0, ratingCount: 0 };
            eventObject.averageRating = summary.averageRating;
            eventObject.ratingCount = summary.ratingCount;
            return eventObject;
        });

        res.json({ events: responseEvents, page, pages: Math.ceil(total / limit), total });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const [event, reviews] = await Promise.all([
            Event.findById(req.params.id).populate('createdBy', 'name email'),
            Booking.find({ eventId: req.params.id, rating: { $ne: null } })
                .populate('userId', 'name')
                .select('rating review userId createdAt')
                .sort({ createdAt: -1 })
        ]);

        if (!event) return res.status(404).json({ message: 'Event not found' });

        const ratingValues = reviews.map((review) => Number(review.rating)).filter((value) => Number.isFinite(value));
        const averageRating = ratingValues.length ? (ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length) : 0;

        const eventData = event.toObject ? event.toObject() : event;
        eventData.averageRating = Number(averageRating.toFixed(1));
        eventData.ratingCount = ratingValues.length;
        eventData.reviews = reviews.map((review) => ({
            id: review._id,
            userName: review.userId?.name || 'Guest',
            rating: Number(review.rating),
            review: review.review || '',
            createdAt: review.createdAt
        }));

        res.json(eventData);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, totalSeats, ticketPrice, image } = req.body;
        const rawImage = typeof image === 'string' ? image.trim() : '';

        let uploadedImage = rawImage;
        if (req.file) {
            uploadedImage = await uploadToCloudinary(req.file);
        }

        const event = await Event.create({
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            availableSeats: Number(totalSeats),
            ticketPrice: ticketPrice || 0,
            image: uploadedImage,
            createdBy: req.user.id,
            status: req.user.role === 'organizer' ? 'draft' : 'published'
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const existing = await Event.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Event not found' });
        if (req.user.role !== 'admin' && existing.createdBy?.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only edit your own events' });
        }
        const updates = { ...req.body };
        const rawImage = typeof updates.image === 'string' ? updates.image.trim() : '';
        if (rawImage) {
            updates.image = rawImage;
        }
        delete updates.availableSeats;
        delete updates.createdBy;
        const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const existing = await Event.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Event not found' });
        if (req.user.role !== 'admin' && existing.createdBy?.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own events' });
        }
        const event = await Event.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
        res.json({ message: 'Event cancelled successfully', event });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
