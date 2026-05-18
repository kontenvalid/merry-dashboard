const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('=== FULL DATABASE VERIFICATION ===\n');

  const admin = await prisma.user.findUnique({
    where: { email: 'kontenval.id@gmail.com' },
    include: { apiKeys: true, dashboardSettings: true, socialAccounts: true }
  });

  console.log('👤 ADMIN:', admin?.email);
  console.log('   ID:', admin?.id);

  console.log('\n🔑 API KEYS:', admin?.apiKeys.length);
  admin?.apiKeys.forEach(k => console.log('   -', k.service, ':', k.isActive ? 'ACTIVE' : 'inactive'));

  console.log('\n⚙️  DASHBOARD SETTINGS:', admin?.dashboardSettings ? 'EXISTS' : 'MISSING');
  if (admin?.dashboardSettings) {
    console.log('   Theme:', admin.dashboardSettings.theme);
    console.log('   Timezone:', admin.dashboardSettings.timezone);
  }

  console.log('\n📱 SOCIAL ACCOUNTS:', admin?.socialAccounts.length);

  console.log('\n📊 ANALYTICS RECORDS:');
  const total = await prisma.analytics.count({ where: { userId: admin?.id } });
  console.log('   Total for admin:', total);

  const byPlatform = await prisma.analytics.groupBy({
    by: ['platform'],
    where: { userId: admin?.id },
    _count: true
  });
  byPlatform.forEach(p => console.log('   -', p.platform + ':', p._count));

  console.log('\n📋 SAMPLE ANALYTICS DATA:');
  const samples = await prisma.analytics.findMany({
    where: { userId: admin?.id },
    take: 3,
    orderBy: { date: 'desc' }
  });
  samples.forEach(s => {
    const date = s.date.toISOString().split('T')[0];
    console.log('   -', s.platform, '| followers:', s.followers, '| likes:', s.likes, '| date:', date);
  });

  await prisma.$disconnect();
  console.log('\n=== VERIFICATION COMPLETE ===');
}

verify().catch(e => { console.log('ERROR:', e.message); process.exit(1); });