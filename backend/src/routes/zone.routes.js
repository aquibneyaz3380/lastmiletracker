// src/routes/zone.routes.js
const express = require('express');
const router = express.Router();
const { createZone, listZones, addArea, deleteZone } = require('../controllers/zone.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, listZones);
router.post('/', authenticate, authorize('ADMIN'), createZone);
router.post('/:zoneId/areas', authenticate, authorize('ADMIN'), addArea);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteZone);

module.exports = router;
