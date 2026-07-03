// src/controllers/admin.controller.js
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { findNearestAgent, assignAgentToOrder } = require('../services/assignment.service');
const { sendStatusEmail } = require('../services/email.service');
const { sendSMS } = require('../services/sms.service');

/** POST /api/admin/agents - Create delivery agent */
const createAgent = async (req, res) => {
  try {
    const { name, email, password, phone, zoneId, latitude, longitude } = req.body;
    if (!name || !email || !password || !zoneId) {
      return res.status(400).json({ error: 'name, email, password, zoneId are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name, email, phone,
        password: hashedPassword,
        role: 'AGENT',
        agentProfile: {
          create: {
            zoneId,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            isAvailable: true
          }
        }
      },
      include: { agentProfile: { include: { zone: true } } }
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      agentProfile: user.agentProfile
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/admin/agents */
const listAgents = async (req, res) => {
  try {
    const agents = await prisma.deliveryAgent.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        zone: true
      }
    });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** POST /api/admin/orders/:id/assign - Manual agent assignment */
const manualAssign = async (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ error: 'agentId is required' });

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { customer: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const agent = await prisma.deliveryAgent.findUnique({ where: { id: agentId } });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    await assignAgentToOrder(order.id, agentId, req.user.id, req.user.role);

    await sendStatusEmail({
      to: order.customer.email,
      customerName: order.customer.name,
      trackingId: order.trackingId,
      status: 'ASSIGNED'
    });
    await sendSMS({ phone: order.customer.phone, status: 'ASSIGNED', trackingId: order.trackingId });

    res.json({ message: 'Agent assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** POST /api/admin/orders/:id/auto-assign - Auto-assign nearest available agent */
const autoAssign = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { customer: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const agent = await findNearestAgent(order.pickupZoneId);
    if (!agent) return res.status(404).json({ error: 'No available agents found' });

    await assignAgentToOrder(order.id, agent.id, req.user.id, req.user.role);

    await sendStatusEmail({
      to: order.customer.email,
      customerName: order.customer.name,
      trackingId: order.trackingId,
      status: 'ASSIGNED'
    });
    await sendSMS({ phone: order.customer.phone, status: 'ASSIGNED', trackingId: order.trackingId });

    res.json({ message: 'Agent auto-assigned', agentId: agent.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** PATCH /api/admin/orders/:id/status - Override order status */
const overrideStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['PENDING','ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RESCHEDULED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { customer: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await prisma.order.update({ where: { id: order.id }, data: { status } });

    await prisma.trackingEvent.create({
      data: {
        orderId: order.id,
        status,
        note: note || `Status overridden by admin to ${status}`,
        actorId: req.user.id,
        actorRole: 'ADMIN'
      }
    });

    // Free agent on terminal statuses
    if ((status === 'DELIVERED' || status === 'FAILED') && order.agentId) {
      await prisma.deliveryAgent.update({
        where: { id: order.agentId },
        data: { isAvailable: true }
      });
    }

    await sendStatusEmail({
      to: order.customer.email,
      customerName: order.customer.name,
      trackingId: order.trackingId,
      status,
      note
    });
    await sendSMS({ phone: order.customer.phone, status, trackingId: order.trackingId });

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/admin/customers */
const listCustomers = async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, phone: true, createdAt: true }
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createAgent, listAgents, manualAssign, autoAssign, overrideStatus, listCustomers };
