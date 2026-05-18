// Fix corrupted timezone and verify final state
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('FIXING CORRUPTED TIMEZONE...\n');

  const adminUser = await prisma.user.findUnique({
    where: { email: 'kontenval.id@gmail.com' }
  });

  if (!adminUser) {
    console.log('ERROR: Admin user not found!');
    return;
  }

  // Fix the timezone
  await prisma.dashboardSettings.updateMany({
    where: { userId: adminUser.id },
    data: {
      theme: 'system',
      language: 'en',
      timezone: 'Asia/Bangkok'
    }
  });

  console.log('✅ Timezone fixed to Asia/Bangkok');

  // Verify
  const settings = await prisma.dashboardSettings.findMany();
  console.log('\n📊 FINAL DASHBOARD SETTINGS TABLE:');
  console.log('Total:', settings.length);
  
  for (const s of settings) {
    console.log('\n--- ID:', s.id);
    console.log('UserID:', s.userId);
    console.log('Theme:', s.theme);
    console.log('Language:', s.language);
    console.log('Timezone:', s.timezone);
  }

  await prisma.$disconnect();
}

fix().catch(console.error);