// Final verification of database state
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('===========================================');
  console.log('  DATABASE VERIFICATION');
  console.log('===========================================\n');

  // 1. Users
  const users = await prisma.user.findMany({
    include: { apiKeys: true, socialAccounts: true, dashboardSettings: true }
  });
  
  console.log('👥 USERS:', users.length);
  for (const u of users) {
    console.log('-------------------------------------------');
    console.log('Name:', u.name);
    console.log('Email:', u.email);
    console.log('ID:', u.id);
    console.log('Role:', u.role);
    console.log('API Keys:', u.apiKeys.length, u.apiKeys.map(k => k.service).join(', '));
    console.log('Social Accounts:', u.socialAccounts.length);
    console.log('Dashboard Settings:', u.dashboardSettings ? 'YES' : 'NO');
  }
  
  console.log('\n-------------------------------------------');
  console.log('📊 ANALYTICS TABLE:');
  try {
    const analyticsCount = await prisma.analytics.count();
    console.log('Total records:', analyticsCount);
    
    // Try to get sample
    const sample = await prisma.analytics.findMany({ take: 3 });
    if (sample.length > 0) {
      console.log('Sample record columns:', Object.keys(sample[0]).join(', '));
      console.log('Does userId column exist?', 'userId' in sample[0]);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('\n===========================================');
  console.log('  SUMMARY FOR ADMIN (kontenval.id@gmail.com)');
  console.log('===========================================');
  
  const admin = users.find(u => u.email === 'kontenval.id@gmail.com');
  if (admin) {
    console.log('✅ Admin found');
    console.log('   User ID:', admin.id);
    console.log('   API Keys:', admin.apiKeys.length, '(composio, meta_graph)');
    console.log('   Social Accounts:', admin.socialAccounts.length);
    console.log('   Dashboard Settings:', admin.dashboardSettings ? 'EXISTS' : 'MISSING');
  } else {
    console.log('❌ Admin not found!');
  }

  await prisma.$disconnect();
}

verify().catch(console.error);