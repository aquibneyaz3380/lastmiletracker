// src/services/rateCalculation.service.js
const prisma = require('../utils/prisma');

/**
 * Detect zone by pincode
 */
const detectZone = async (pincode) => {
  const area = await prisma.area.findUnique({
    where: { pincode },
    include: { zone: true }
  });
  if (!area) throw new Error(`No zone found for pincode: ${pincode}`);
  return area.zone;
};

/**
 * Calculate volumetric weight: L x B x H / 5000
 */
const calcVolumetricWeight = (length, breadth, height) => {
  return (length * breadth * height) / 5000;
};

/**
 * Calculate order charge
 * @param {Object} params
 * @returns {Object} { baseCharge, codSurcharge, totalCharge, volumetricWeight, chargeableWeight }
 */
const calculateCharge = async ({
  pickupPincode,
  dropPincode,
  length,
  breadth,
  height,
  actualWeight,
  orderType,
  paymentType
}) => {
  // Detect zones
  const pickupZone = await detectZone(pickupPincode);
  const dropZone = await detectZone(dropPincode);

  // Volumetric weight
  const volumetricWeight = calcVolumetricWeight(length, breadth, height);

  // Chargeable weight = higher of actual vs volumetric
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  // Find rate card for orderType + fromZone + toZone
  const rateCard = await prisma.rateCard.findUnique({
    where: {
      orderType_fromZoneId_toZoneId: {
        orderType,
        fromZoneId: pickupZone.id,
        toZoneId: dropZone.id
      }
    }
  });

  if (!rateCard) {
    throw new Error(
      `No rate card configured for ${orderType} orders from zone "${pickupZone.name}" to zone "${dropZone.name}"`
    );
  }

  const baseCharge = chargeableWeight * rateCard.ratePerKg;
  const codSurcharge = paymentType === 'COD' ? rateCard.codSurcharge : 0;
  const totalCharge = baseCharge + codSurcharge;

  return {
    pickupZone,
    dropZone,
    volumetricWeight: parseFloat(volumetricWeight.toFixed(3)),
    chargeableWeight: parseFloat(chargeableWeight.toFixed(3)),
    baseCharge: parseFloat(baseCharge.toFixed(2)),
    codSurcharge: parseFloat(codSurcharge.toFixed(2)),
    totalCharge: parseFloat(totalCharge.toFixed(2))
  };
};

module.exports = { detectZone, calcVolumetricWeight, calculateCharge };
