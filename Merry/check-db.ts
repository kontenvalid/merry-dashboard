import prisma from './src/lib/prisma';

async function checkDatabase() {
  console.log('🔍 Checking full database state...\n');

  // 1. All users
  console.log('👥 All Users:');
  const users = await prisma.user.findMany({
    include: {
      apiKeys: true,
      socialAccounts: true,
      dashboardSettings: true,
    }
  });
  console.log(`   Total: ${users.length}`);
  for (const u of users) {
    console.log(`   - ${u.name} (${u.email}) - Role: ${u.role}`);
    console.log(`     API Keys: ${u.apiKeys.length}, Social: ${u.socialAccounts.length}, Settings: ${u.dashboardSettings ? 'yes' : 'no'}`);
  }
  console.log('');

  // 2. Analytics count (direct query, no relation)
  try {
    const analyticsCount = await prisma.analytics.count();
    console.log('📊 Analytics Records (total):', analyticsCount);
  } catch (e: any) {
    console.log('📊 Analytics: Error -', e.message.includes('does not exist') ? 'table missing' : e.message);
  }
  console.log('');

  // 3. Check DashboardSettings table directly
  console.log('⚙️  Dashboard Settings Table:');
  const settings = await prisma.dashboardSettings.findMany();
  console.log(`   Total records: ${settings.length}`);
  for (const s of settings) {
    console.log(`   - UserID: ${s.userId}, Theme: ${s.theme}, TZ: ${s.timezone}`);
  }
  console.log('');

  // 4. Check API Keys table directly
  console.log('🔑 API Keys Table:');
  const apiKeys = await prisma.apiKey.findMany();
  console.log(`   Total records: ${apiKeys.length}`);
  for (const k of apiKeys) {
    console.log(`   - UserID: ${k.userId}, Service: ${k.service}, Active: ${k.isActive}`);
  }

  await prisma.$disconnect();
}

checkDatabase().catch(console.error);