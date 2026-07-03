// src/utils/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lastmile.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@lastmile.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });
  console.log('Admin created:', admin.email);

  // Zones
  const zoneNorth = await prisma.zone.upsert({
    where: { name: 'North Zone' }, update: {}, create: { name: 'North Zone' }
  });
  const zoneSouth = await prisma.zone.upsert({
    where: { name: 'South Zone' }, update: {}, create: { name: 'South Zone' }
  });
  const zoneEast = await prisma.zone.upsert({
    where: { name: 'East Zone' }, update: {}, create: { name: 'East Zone' }
  });
  console.log('Zones created');

  // Areas (pincodes)
  const areas = [
    { name: 'Connaught Place', pincode: '110001', zoneId: zoneNorth.id },
    { name: 'Karol Bagh', pincode: '110005', zoneId: zoneNorth.id },
    { name: 'Saket', pincode: '110017', zoneId: zoneSouth.id },
    { name: 'Hauz Khas', pincode: '110016', zoneId: zoneSouth.id },
    { name: 'Laxmi Nagar', pincode: '110092', zoneId: zoneEast.id },
    { name: 'Mayur Vihar', pincode: '110091', zoneId: zoneEast.id }
  ];
  for (const a of areas) {
    await prisma.area.upsert({
      where: { pincode: a.pincode },
      update: {},
      create: a
    });
  }
  console.log('Areas created');

  // Rate cards - B2C
  const zones = [zoneNorth, zoneSouth, zoneEast];
  for (const from of zones) {
    for (const to of zones) {
      const isIntra = from.id === to.id;
      await prisma.rateCard.upsert({
        where: { orderType_fromZoneId_toZoneId: { orderType: 'B2C', fromZoneId: from.id, toZoneId: to.id } },
        update: {},
        create: {
          orderType: 'B2C',
          fromZoneId: from.id,
          toZoneId: to.id,
          ratePerKg: isIntra ? 30 : 50,
          codSurcharge: 25
        }
      });
      await prisma.rateCard.upsert({
        where: { orderType_fromZoneId_toZoneId: { orderType: 'B2B', fromZoneId: from.id, toZoneId: to.id } },
        update: {},
        create: {
          orderType: 'B2B',
          fromZoneId: from.id,
          toZoneId: to.id,
          ratePerKg: isIntra ? 22 : 38,
          codSurcharge: 15
        }
      });
    }
  }
  console.log('Rate cards created');

  // Sample agent
  const agentPassword = await bcrypt.hash('Agent@123', 10);
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent1@lastmile.com' },
    update: {},
    create: {
      name: 'Ravi Kumar',
      email: 'agent1@lastmile.com',
      password: agentPassword,
      phone: '9876543210',
      role: 'AGENT',
      agentProfile: {
        create: {
          zoneId: zoneNorth.id,
          latitude: 28.6315,
          longitude: 77.2167,
          isAvailable: true
        }
      }
    }
  });
  console.log('Sample agent created:', agentUser.email);

  // Sample customer
  const custPassword = await bcrypt.hash('Customer@123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer1@lastmile.com' },
    update: {},
    create: {
      name: 'Amit Sharma',
      email: 'customer1@lastmile.com',
      password: custPassword,
      phone: '9123456780',
      role: 'CUSTOMER'
    }
  });
  console.log('Sample customer created:', customer.email);

  console.log('\nSeeding complete!');
  console.log('--- Login Credentials ---');
  console.log('Admin:    admin@lastmile.com / Admin@123');
  console.log('Agent:    agent1@lastmile.com / Agent@123');
  console.log('Customer: customer1@lastmile.com / Customer@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
