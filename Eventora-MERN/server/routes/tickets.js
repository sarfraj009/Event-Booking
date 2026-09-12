const express = require('express');
const { protect } = require('../middleware/auth');
const { downloadTicket } = require('../controllers/ticketController');

const router = express.Router();
router.get('/:id/download', protect, downloadTicket);
module.exports = router;