const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('MIGRATING VIA RAW SQL...');

  const admin = await prisma.user.findUnique({ where: { email: 'kontenval.id@gmail.com' } });
  if (!admin) {
    console.log('ADMIN NOT FOUND');
    return;
  }
  console.log('ADMIN_ID=' + admin.id);

  try {
    // Use raw SQL to update null values
    const result = await prisma.$executeRaw`UPDATE analytics SET "userId" = ${admin.id} WHERE "userId" IS NULL`;
    console.log('UPDATED VIA RAW SQL=' + result);
  } catch (e) {
    console.log('ERROR=' + e.message);
  }

  const count = await prisma.analytics.count({ where: { userId: admin.id } });
  console.log('ADMIN_RECORDS=' + count);

  await prisma.$disconnect();
  console.log('DONE');
}

migrate().then(() => process.exit(0)).catch(e => { console.log('ERROR=' + e.message); process.exit(1); });