// src/controllers/tracking.controller.js
const prisma = require('../utils/prisma');

/**
 * GET /api/tracking/:trackingId - Public tracking lookup (no auth required)
 */
const trackOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { trackingId: req.params.trackingId },
      include: {
        pickupZone: true,
        dropZone: true,
        trackingHistory: { orderBy: { createdAt: 'asc' } },
        agent: { include: { user: { select: { name: true, phone: true } } } }
      }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      trackingId: order.trackingId,
      status: order.status,
      pickupAddress: order.pickupAddress,
      dropAddress: order.dropAddress,
      scheduledDate: order.scheduledDate,
      agent: order.agent ? { name: order.agent.user.name, phone: order.agent.user.phone } : null,
      trackingHistory: order.trackingHistory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { trackOrder };
