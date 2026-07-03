// src/controllers/agent.controller.js
const prisma = require('../utils/prisma');
const { sendStatusEmail } = require('../services/email.service');
const { sendSMS } = require('../services/sms.service');

// Valid agent status transitions
const VALID_TRANSITIONS = {
  ASSIGNED:         ['PICKED_UP'],
  PICKED_UP:        ['IN_TRANSIT'],
  IN_TRANSIT:       ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED']
};

/**
 * GET /api/agent/orders - Agent's assigned orders
 */
const myOrders = async (req, res) => {
  try {
    const agent = await prisma.deliveryAgent.findUnique({ where: { userId: req.user.id } });
    if (!agent) return res.status(404).json({ error: 'Agent profile not found' });

    const orders = await prisma.order.findMany({
      where: { agentId: agent.id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        pickupZone: true,
        dropZone: true,
        trackingHistory: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/agent/orders/:id/status - Update delivery status
 */
const updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const agent = await prisma.deliveryAgent.findUnique({ where: { userId: req.user.id } });
    if (!agent) return res.status(404).json({ error: 'Agent profile not found' });

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { customer: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.agentId !== agent.id) return res.status(403).json({ error: 'This order is not assigned to you' });

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.join(', ')}`
      });
    }

    await prisma.order.update({ where: { id: order.id }, data: { status } });

    await prisma.trackingEvent.create({
      data: {
        orderId: order.id,
        status,
        note: note || null,
        actorId: req.user.id,
        actorRole: 'AGENT'
      }
    });

    // On delivered or failed, mark agent available
    if (status === 'DELIVERED' || status === 'FAILED') {
      await prisma.deliveryAgent.update({
        where: { id: agent.id },
        data: { isAvailable: true }
      });
    }

    // Notify customer via email and SMS
    await sendStatusEmail({
      to: order.customer.email,
      customerName: order.customer.name,
      trackingId: order.trackingId,
      status,
      note
    });

    await sendSMS({
      phone: order.customer.phone,
      status,
      trackingId: order.trackingId
    });

    res.json({ message: 'Status updated successfully', status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /api/agent/location - Update agent GPS location
 */
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ error: 'latitude and longitude required' });

    await prisma.deliveryAgent.update({
      where: { userId: req.user.id },
      data: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
    });
    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { myOrders, updateStatus, updateLocation };
