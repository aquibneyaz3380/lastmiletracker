// src/routes/tracking.routes.js
const express = require('express');
const router = express.Router();
const { trackOrder } = require('../controllers/tracking.controller');

// Public route - no auth required for tracking
router.get('/:trackingId', trackOrder);

module.exports = router;
