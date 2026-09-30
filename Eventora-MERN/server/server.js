const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

dotenv.config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const Booking = require('./models/Booking');
const { cleanupCancelledBookings } = require('./controllers/bookingController');

const app = express();

/* =========================
   CORS CONFIGURATION
========================= */

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

// Allow CORS
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests
app.options(/.*/, cors(corsOptions));

/* =========================
   SECURITY & MIDDLEWARE
========================= */

app.use(helmet());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  })
);

app.use(express.json({ limit: '10mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

/* =========================
   MULTIPART REQUEST HANDLER
========================= */

app.use((req, res, next) => {
  if (req.originalUrl.includes('/api/events')) {
    if (
      req.headers['content-type'] &&
      req.headers['content-type'].includes('multipart/form-data')
    ) {
      return next();
    }
  }

  return next();
});

/* =========================
   ROUTES
========================= */

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

/* =========================
   HEALTH CHECK
========================= */

app.get('/', (req, res) => {
  res.status(200).send('Eventora API is running');
});

/* =========================
   DATABASE CONNECTION
========================= */

mongoose
  .connect(
    process.env.MONGO_URI || 'mongodb://localhost:27017/eventora'
  )
  .then(() => {
    console.log('MongoDB Connected');

    cleanupCancelledBookings();

    setInterval(
      cleanupCancelledBookings,
      60 * 60 * 1000
    );
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
  });

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

/* =========================
   ERROR HANDLER
========================= */

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode
      ? error.message
      : 'Internal server error'
  });
});