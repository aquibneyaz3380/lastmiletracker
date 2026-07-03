// src/routes/rateCard.routes.js
const express = require('express');
const router = express.Router();
const { createRateCard, listRateCards, deleteRateCard } = require('../controllers/rateCard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, listRateCards);
router.post('/', authenticate, authorize('ADMIN'), createRateCard);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteRateCard);

module.exports = router;
