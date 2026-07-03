// src/routes/agent.routes.js
const express = require('express');
const router = express.Router();
const { myOrders, updateStatus, updateLocation } = require('../controllers/agent.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('AGENT'));

router.get('/orders', myOrders);
router.patch('/orders/:id/status', updateStatus);
router.patch('/location', updateLocation);

module.exports = router;
