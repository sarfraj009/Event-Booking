const express = require('express');
const { protect } = require('../middleware/auth');
const { createOrder, verifyPayment } = require('../controllers/paymentController');

const router = express.Router();
router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
module.exports = router;