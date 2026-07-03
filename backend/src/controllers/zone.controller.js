// src/controllers/zone.controller.js
const prisma = require('../utils/prisma');

const createZone = async (req, res) => {
  try {
    const { name } = req.body;
    const zone = await prisma.zone.create({ data: { name } });
    res.status(201).json(zone);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Zone name already exists' });
    res.status(500).json({ error: err.message });
  }
};

const listZones = async (req, res) => {
  try {
    const zones = await prisma.zone.findMany({ include: { areas: true } });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addArea = async (req, res) => {
  try {
    const { name, pincode } = req.body;
    const area = await prisma.area.create({
      data: { name, pincode, zoneId: req.params.zoneId }
    });
    res.status(201).json(area);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Pincode already assigned to a zone' });
    res.status(500).json({ error: err.message });
  }
};

const deleteZone = async (req, res) => {
  try {
    await prisma.zone.delete({ where: { id: req.params.id } });
    res.json({ message: 'Zone deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createZone, listZones, addArea, deleteZone };
