const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== All API Keys ===\n');
  
  const keys = await prisma.apiKey.findMany();
  console.log('Total API Keys:', keys.length);
  
  for (const key of keys) {
    console.log('\n---');
    console.log('  ID:', key.id);
    console.log('  User ID:', key.userId);
    console.log('  Service:', key.service);
    console.log('  API Key:', key.apiKey.substring(0, 30) + '...');
    console.log('  Is Active:', key.isActive);
  }
  
  // Try to find meta_graph key
  console.log('\n=== Searching for meta_graph key ===');
  const metaKey = await prisma.apiKey.findFirst({
    where: { service: 'meta_graph' }
  });
  console.log('meta_graph key:', metaKey ? 'FOUND' : 'NOT FOUND');
  
  await prisma.$disconnect();
}

check().catch(console.error);
