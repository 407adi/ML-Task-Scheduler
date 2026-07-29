const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database with initial resources and demo data...');

  const existingCount = await prisma.resource.count();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} resources. Skipping seed.`);
    return;
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create demo users
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true
    }
  });

  await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User',
      role: 'USER',
      isActive: true
    }
  });

  // 2. Create resources (Cloud, Fog, Edge, GPU)
  const resources = await Promise.all([
    prisma.resource.create({ data: { name: 'Cloud-Server-1', capacity: 100, currentLoad: 35, status: 'AVAILABLE' } }),
    prisma.resource.create({ data: { name: 'Cloud-Server-2', capacity: 100, currentLoad: 60, status: 'AVAILABLE' } }),
    prisma.resource.create({ data: { name: 'Fog-Node-A', capacity: 50, currentLoad: 20, status: 'AVAILABLE' } }),
    prisma.resource.create({ data: { name: 'Fog-Node-B', capacity: 50, currentLoad: 45, status: 'AVAILABLE' } }),
    prisma.resource.create({ data: { name: 'Fog-Node-C', capacity: 40, currentLoad: 15, status: 'AVAILABLE' } }),
    prisma.resource.create({ data: { name: 'Edge-Device-1', capacity: 20, currentLoad: 10, status: 'AVAILABLE' } }),
    prisma.resource.create({ data: { name: 'Edge-Device-2', capacity: 20, currentLoad: 80, status: 'BUSY' } }),
    prisma.resource.create({ data: { name: 'Edge-Device-3', capacity: 15, currentLoad: 0, status: 'OFFLINE' } }),
    prisma.resource.create({ data: { name: 'GPU-Node-1', capacity: 80, currentLoad: 50, status: 'AVAILABLE' } }),
    prisma.resource.create({ data: { name: 'GPU-Node-2', capacity: 80, currentLoad: 25, status: 'AVAILABLE' } })
  ]);
  console.log(`✅ Created ${resources.length} resources`);

  // 3. Create sample tasks
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.task.create({ data: { name: 'Real-time Video Processing', type: 'CPU', size: 'LARGE', priority: 5, status: 'RUNNING', dueDate: tomorrow, predictedTime: 120.5, resourceId: resources[8].id } }),
    prisma.task.create({ data: { name: 'Critical Database Backup', type: 'IO', size: 'LARGE', priority: 5, status: 'SCHEDULED', dueDate: tomorrow, predictedTime: 45.0, resourceId: resources[0].id } }),
    prisma.task.create({ data: { name: 'Security Log Analysis', type: 'MIXED', size: 'LARGE', priority: 5, status: 'PENDING', dueDate: tomorrow, predictedTime: 90.0 } }),
    prisma.task.create({ data: { name: 'Image Batch Processing', type: 'CPU', size: 'MEDIUM', priority: 4, status: 'RUNNING', predictedTime: 60.0, resourceId: resources[9].id } }),
    prisma.task.create({ data: { name: 'ML Model Training', type: 'CPU', size: 'LARGE', priority: 4, status: 'SCHEDULED', predictedTime: 180.0, resourceId: resources[8].id } }),
    prisma.task.create({ data: { name: 'Thumbnail Generation', type: 'CPU', size: 'SMALL', priority: 3, status: 'RUNNING', predictedTime: 20.0, resourceId: resources[5].id } })
  ]);
  console.log('✅ Created sample tasks');

  console.log('🎉 Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
