// src/controllers/rateCard.controller.js
const prisma = require('../utils/prisma');

const createRateCard = async (req, res) => {
  try {
    const { orderType, fromZoneId, toZoneId, ratePerKg, codSurcharge } = req.body;

    if (!orderType || !fromZoneId || !toZoneId || !ratePerKg) {
      return res.status(400).json({ error: 'orderType, fromZoneId, toZoneId, ratePerKg are required' });
    }

    const rateCard = await prisma.rateCard.upsert({
      where: { orderType_fromZoneId_toZoneId: { orderType, fromZoneId, toZoneId } },
      update: { ratePerKg: parseFloat(ratePerKg), codSurcharge: parseFloat(codSurcharge || 0) },
      create: {
        orderType, fromZoneId, toZoneId,
        ratePerKg: parseFloat(ratePerKg),
        codSurcharge: parseFloat(codSurcharge || 0)
      },
      include: { fromZone: true, toZone: true }
    });

    res.status(201).json(rateCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listRateCards = async (req, res) => {
  try {
    const rateCards = await prisma.rateCard.findMany({
      include: { fromZone: true, toZone: true },
      orderBy: [{ orderType: 'asc' }, { createdAt: 'asc' }]
    });
    res.json(rateCards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteRateCard = async (req, res) => {
  try {
    await prisma.rateCard.delete({ where: { id: req.params.id } });
    res.json({ message: 'Rate card deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createRateCard, listRateCards, deleteRateCard };
