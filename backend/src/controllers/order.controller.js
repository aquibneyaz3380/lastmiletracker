// src/controllers/order.controller.js
const prisma = require('../utils/prisma');
const { calculateCharge } = require('../services/rateCalculation.service');
const { findNearestAgent, assignAgentToOrder } = require('../services/assignment.service');
const { sendStatusEmail } = require('../services/email.service');
const { sendSMS } = require('../services/sms.service');

/** GET /api/orders/quote */
const getQuote = async (req, res) => {
  try {
    const { pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType } = req.query;
    if (!pickupPincode || !dropPincode || !length || !breadth || !height || !actualWeight || !orderType || !paymentType) {
      return res.status(400).json({ error: 'All fields required: pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType' });
    }
    const result = await calculateCharge({
      pickupPincode, dropPincode,
      length: parseFloat(length), breadth: parseFloat(breadth), height: parseFloat(height),
      actualWeight: parseFloat(actualWeight), orderType, paymentType
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/** POST /api/orders */
const createOrder = async (req, res) => {
  try {
    const { customerId, pickupAddress, pickupPincode, dropAddress, dropPincode,
      length, breadth, height, actualWeight, orderType, paymentType, scheduledDate } = req.body;

    let finalCustomerId;
    if (req.user.role === 'ADMIN' && customerId) finalCustomerId = customerId;
    else if (req.user.role === 'CUSTOMER') finalCustomerId = req.user.id;
    else return res.status(400).json({ error: 'customerId required when creating order as admin' });

    const chargeResult = await calculateCharge({
      pickupPincode, dropPincode,
      length: parseFloat(length), breadth: parseFloat(breadth), height: parseFloat(height),
      actualWeight: parseFloat(actualWeight), orderType, paymentType
    });

    const order = await prisma.order.create({
      data: {
        customerId: finalCustomerId,
        createdById: req.user.role === 'ADMIN' ? req.user.id : null,
        pickupAddress, pickupPincode, pickupZoneId: chargeResult.pickupZone.id,
        dropAddress, dropPincode, dropZoneId: chargeResult.dropZone.id,
        length: parseFloat(length), breadth: parseFloat(breadth), height: parseFloat(height),
        actualWeight: parseFloat(actualWeight),
        volumetricWeight: chargeResult.volumetricWeight,
        chargeableWeight: chargeResult.chargeableWeight,
        orderType, paymentType,
        baseCharge: chargeResult.baseCharge,
        codSurcharge: chargeResult.codSurcharge,
        totalCharge: chargeResult.totalCharge,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: 'PENDING'
      },
      include: { customer: true, pickupZone: true, dropZone: true }
    });

    await prisma.trackingEvent.create({
      data: { orderId: order.id, status: 'PENDING', note: 'Order placed', actorId: req.user.id, actorRole: req.user.role }
    });

    await sendStatusEmail({ to: order.customer.email, customerName: order.customer.name, trackingId: order.trackingId, status: 'PENDING' });
    await sendSMS({ phone: order.customer.phone, status: 'PENDING', trackingId: order.trackingId });

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/** GET /api/orders */
const listOrders = async (req, res) => {
  try {
    const { status, zoneId, agentId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (req.user.role === 'CUSTOMER') where.customerId = req.user.id;
    if (req.user.role === 'AGENT') {
      const agent = await prisma.deliveryAgent.findUnique({ where: { userId: req.user.id } });
      if (agent) where.agentId = agent.id;
    }
    if (status) where.status = status;
    if (zoneId) where.pickupZoneId = zoneId;
    if (agentId && req.user.role === 'ADMIN') where.agentId = agentId;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          agent: { include: { user: { select: { name: true, email: true } } } },
          pickupZone: true, dropZone: true
        },
        orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);
    res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/orders/:id */
const getOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        agent: { include: { user: { select: { name: true, email: true, phone: true } } } },
        pickupZone: true, dropZone: true,
        trackingHistory: { orderBy: { createdAt: 'asc' } }
      }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role === 'CUSTOMER' && order.customerId !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/orders/:id/reschedule
 * Customer reschedules a FAILED order.
 * Per spec: "agent is reassigned for the rescheduled attempt"
 * → We free old agent, set RESCHEDULED, then immediately auto-assign nearest agent.
 */
const rescheduleOrder = async (req, res) => {
  try {
    const { scheduledDate } = req.body;
    if (!scheduledDate) return res.status(400).json({ error: 'scheduledDate is required' });

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { customer: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.customerId !== req.user.id && req.user.role !== 'ADMIN')
      return res.status(403).json({ error: 'Access denied' });
    if (order.status !== 'FAILED')
      return res.status(400).json({ error: 'Only FAILED orders can be rescheduled' });

    // Step 1: Free the previous agent
    if (order.agentId) {
      await prisma.deliveryAgent.update({ where: { id: order.agentId }, data: { isAvailable: true } });
    }

    // Step 2: Set order to RESCHEDULED
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'RESCHEDULED', scheduledDate: new Date(scheduledDate), agentId: null }
    });

    await prisma.trackingEvent.create({
      data: {
        orderId: order.id, status: 'RESCHEDULED',
        note: `Rescheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
        actorId: req.user.id, actorRole: req.user.role
      }
    });

    // Step 3: Auto-assign nearest available agent for the rescheduled attempt
    const agent = await findNearestAgent(order.pickupZoneId);
    if (agent) {
      await assignAgentToOrder(order.id, agent.id, req.user.id, req.user.role);
      await sendStatusEmail({
        to: order.customer.email, customerName: order.customer.name,
        trackingId: order.trackingId, status: 'ASSIGNED',
        note: `Reassigned for rescheduled delivery on ${new Date(scheduledDate).toLocaleDateString()}`
      });
      await sendSMS({ phone: order.customer.phone, status: 'ASSIGNED', trackingId: order.trackingId });
    }

    // Also notify about reschedule
    await sendStatusEmail({
      to: order.customer.email, customerName: order.customer.name,
      trackingId: order.trackingId, status: 'RESCHEDULED', scheduledDate
    });
    await sendSMS({ phone: order.customer.phone, status: 'RESCHEDULED', trackingId: order.trackingId });

    res.json({
      message: agent ? 'Order rescheduled and agent reassigned' : 'Order rescheduled (no agents available, admin will assign)',
      agentAssigned: !!agent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getQuote, createOrder, listOrders, getOrder, rescheduleOrder };
