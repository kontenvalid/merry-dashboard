const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('VERIFICATION START');
  
  const users = await prisma.user.findMany({
    include: { apiKeys: true }
  });
  
  console.log('USER_COUNT=' + users.length);
  
  const admin = users.find(u => u.email === 'kontenval.id@gmail.com');
  if (admin) {
    console.log('ADMIN_ID=' + admin.id);
    console.log('ADMIN_KEYS=' + admin.apiKeys.length);
    console.log('ADMIN_KEY_SERVICES=' + admin.apiKeys.map(k => k.service).join(';'));
  }
  
  await prisma.$disconnect();
}

verify().then(() => process.exit(0)).catch(e => { console.log('ERROR:' + e.message); process.exit(1); });