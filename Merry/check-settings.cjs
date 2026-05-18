// Check Dashboard Settings in detail
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('DASHBOARD SETTINGS DETAILS...\n');
  
  const settings = await prisma.dashboardSettings.findMany();
  console.log('Total:', settings.length);
  
  for (const s of settings) {
    console.log('\n--- Settings ID:', s.id);
    console.log('UserID:', s.userId);
    console.log('Theme:', s.theme);
    console.log('Language:', s.language);
    console.log('Timezone:', s.timezone);
    console.log('MetaAdsData:', s.metaAdsData ? 'EXISTS' : 'NULL');
  }
  
  await prisma.$disconnect();
}

check();