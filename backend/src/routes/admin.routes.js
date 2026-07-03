// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const {
  createAgent, listAgents, manualAssign, autoAssign, overrideStatus, listCustomers
} = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('ADMIN'));

router.post('/agents', createAgent);
router.get('/agents', listAgents);
router.get('/customers', listCustomers);
router.post('/orders/:id/assign', manualAssign);
router.post('/orders/:id/auto-assign', autoAssign);
router.patch('/orders/:id/status', overrideStatus);

module.exports = router;
