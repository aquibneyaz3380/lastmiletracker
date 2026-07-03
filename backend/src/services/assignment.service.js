// src/services/assignment.service.js
const prisma = require('../utils/prisma');

/**
 * Find the nearest available agent.
 * Priority:
 *  1) Same zone agents → sorted by Haversine distance if coords available
 *  2) Any zone agents → sorted by Haversine distance if coords available
 *  3) First available agent as fallback
 */
const findNearestAgent = async (pickupZoneId, pickupLat = null, pickupLng = null) => {
  const availableAgents = await prisma.deliveryAgent.findMany({
    where: { isAvailable: true },
    include: { user: true }
  });

  if (availableAgents.length === 0) return null;

  const sameZoneAgents = availableAgents.filter(a => a.zoneId === pickupZoneId);
  const candidatePool = sameZoneAgents.length > 0 ? sameZoneAgents : availableAgents;

  if (pickupLat !== null && pickupLng !== null) {
    const withDistance = candidatePool
      .filter(a => a.latitude !== null && a.longitude !== null)
      .map(a => ({
        ...a,
        distance: haversineDistance(pickupLat, pickupLng, a.latitude, a.longitude)
      }))
      .sort((a, b) => a.distance - b.distance);

    if (withDistance.length > 0) return withDistance[0];
  }

  return candidatePool[0] || null;
};

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Atomically assign agent to order:
 * - Updates order status to ASSIGNED and sets agentId
 * - Marks agent isAvailable = false
 * - Appends immutable TrackingEvent
 */
const assignAgentToOrder = async (orderId, agentId, actorId, actorRole) => {
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { agentId, status: 'ASSIGNED' }
    }),
    prisma.deliveryAgent.update({
      where: { id: agentId },
      data: { isAvailable: false }
    }),
    prisma.trackingEvent.create({
      data: { orderId, status: 'ASSIGNED', note: 'Agent assigned to order', actorId, actorRole }
    })
  ]);
};

module.exports = { findNearestAgent, assignAgentToOrder };
