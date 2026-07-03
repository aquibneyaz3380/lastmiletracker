// src/routes/order.routes.js
const express = require('express');
const router = express.Router();
const { getQuote, createOrder, listOrders, getOrder, rescheduleOrder } = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/quote', authenticate, getQuote);
router.post('/', authenticate, authorize('CUSTOMER', 'ADMIN'), createOrder);
router.get('/', authenticate, listOrders);
router.get('/:id', authenticate, getOrder);
router.post('/:id/reschedule', authenticate, authorize('CUSTOMER', 'ADMIN'), rescheduleOrder);

module.exports = router;
