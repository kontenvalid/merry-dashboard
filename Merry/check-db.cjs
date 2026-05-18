// Check database state
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('CHECKING DATABASE...\n');
  
  try {
    const users = await prisma.user.findMany({ include: { apiKeys: true } });
    console.log('Users:', users.length);
    for (const u of users) {
      console.log(' - ' + u.name + ': ' + u.email + ' | Keys: ' + u.apiKeys.length);
      for (const k of u.apiKeys) {
        console.log('   * ' + k.service + ': ' + k.isActive);
      }
    }
    
    const settings = await prisma.dashboardSettings.findMany();
    console.log('\nDashboard Settings:', settings.length);
    
    const keys = await prisma.apiKey.findMany();
    console.log('\nAPI Keys:', keys.length);
    for (const k of keys) {
      console.log(' - ' + k.userId + ': ' + k.service + ' (' + k.isActive + ')');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
  
  await prisma.$disconnect();
}

check();