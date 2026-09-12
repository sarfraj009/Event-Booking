const express = require('express');
const router = express.Router();
const { getEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../utils/upload');

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', protect, authorize('organizer', 'admin'), upload.single('image'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

module.exports = router;
