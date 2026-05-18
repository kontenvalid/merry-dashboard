const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function v() {
  const a = await p.user.findUnique({ where: { email: 'kontenval.id@gmail.com' }, include: { apiKeys: true } });
  console.log('ADMIN=' + a?.email);
  console.log('ID=' + a?.id);
  console.log('KEYS=' + a?.apiKeys.length);
  const c = await p.analytics.count({ where: { userId: a?.id } });
  console.log('ANALYTICS=' + c);
  await p.$disconnect();
}

v().catch(e => console.log('E:' + e.message));