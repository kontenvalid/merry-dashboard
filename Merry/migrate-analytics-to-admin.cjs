// Migrate analytics data to admin user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('MIGRATING ANALYTICS TO ADMIN...\n');

  const adminUser = await prisma.user.findUnique({
    where: { email: 'kontenval.id@gmail.com' }
  });

  if (!adminUser) {
    console.log('ERROR: Admin not found!');
    return;
  }

  console.log('Admin ID:', adminUser.id);

  // Count null userId records
  const nullCount = await prisma.analytics.count({
    where: {
      userId: null
    }
  });

  console.log('Records with NULL userId:', nullCount);

  if (nullCount > 0) {
    // Update all null records to admin
    await prisma.analytics.updateMany({
      where: { userId: null },
      data: { userId: adminUser.id }
    });
    console.log('✅ Updated', nullCount, 'records to admin userId');
  }

  // Verify
  const adminCount = await prisma.analytics.count({
    where: { userId: adminUser.id }
  });

  console.log('\n✅ FINAL STATE:');
  console.log('Admin analytics records:', adminCount);

  // Show platform breakdown
  const platforms = await prisma.analytics.groupBy({
    by: ['platform'],
    where: { userId: adminUser.id },
    _count: true
  });

  console.log('\nPlatform breakdown:');
  platforms.forEach(p => {
    console.log('  -', p.platform + ':', p._count, 'records');
  });

  // Show sample data
  const samples = await prisma.analytics.findMany({
    where: { userId: adminUser.id },
    take: 5
  });

  console.log('\nSample data:');
  samples.forEach(s => {
    console.log('  -', s.platform, ': followers=' + s.followers + ', likes=' + s.likes + ', date=' + s.date.toISOString().split('T')[0]);
  });

  await prisma.$disconnect();
}

migrate().catch(e => { console.log('ERROR:', e.message); prisma.$disconnect(); });