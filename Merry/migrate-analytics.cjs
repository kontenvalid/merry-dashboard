// Migrate analytics data - add userId to existing records
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateAnalytics() {
  console.log('MIGRATING ANALYTICS DATA...\n');

  // Get admin user
  const adminUser = await prisma.user.findUnique({
    where: { email: 'kontenval.id@gmail.com' }
  });

  if (!adminUser) {
    console.log('ERROR: Admin user not found!');
    return;
  }

  console.log('Admin User ID:', adminUser.id);
  console.log('');

  // Check if userId column exists
  try {
    const test = await prisma.analytics.findFirst({
      where: { userId: adminUser.id }
    });
    console.log('✅ userId column exists in analytics table');
  } catch (e) {
    console.log('❌ userId column does NOT exist in analytics table');
    console.log('   Need to run: npx prisma db push --accept-data-loss');
    console.log('   This will require --force-reset due to existing data');
    console.log('');
    console.log('   Alternatively, we can check if there are any records without userId');
    
    // Try to count records
    try {
      const totalCount = await prisma.analytics.count();
      console.log('   Total analytics records:', totalCount);
    } catch (e2) {
      console.log('   Cannot count - column truly missing');
    }
    
    return;
  }

  // If we get here, userId column exists
  console.log('Checking for records without userId...\n');

  // Count records
  const totalCount = await prisma.analytics.count();
  console.log('Total records:', totalCount);

  // Find records without userId (userId is empty string or null)
  const orphanRecords = await prisma.analytics.findMany({
    where: {
      OR: [
        { userId: '' },
        { userId: null }
      ]
    }
  });

  console.log('Records without userId:', orphanRecords.length);

  if (orphanRecords.length > 0) {
    console.log('\nMigrating', orphanRecords.length, 'records to admin user...');

    // Update all orphan records to admin
    const result = await prisma.analytics.updateMany({
      where: {
        OR: [
          { userId: '' },
          { userId: null }
        ]
      },
      data: {
        userId: adminUser.id
      }
    });

    console.log('Updated:', result.count, 'records');
  }

  // Verify
  const adminAnalytics = await prisma.analytics.findMany({
    where: { userId: adminUser.id }
  });

  console.log('\n✅ Final state:');
  console.log('   Admin analytics records:', adminAnalytics.length);

  // Show sample
  if (adminAnalytics.length > 0) {
    console.log('\nSample records:');
    adminAnalytics.slice(0, 3).forEach(r => {
      console.log('   -', r.platform, ': followers=' + r.followers + ', date=' + r.date.toISOString().split('T')[0]);
    });
  }

  await prisma.$disconnect();
}

migrateAnalytics().catch(e => {
  console.log('ERROR:', e.message);
  prisma.$disconnect();
});