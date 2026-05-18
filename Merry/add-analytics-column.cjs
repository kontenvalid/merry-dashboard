// Add userId column to analytics table via raw SQL
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addUserIdColumn() {
  console.log('ADDING USERID COLUMN TO ANALYTICS...\n');

  try {
    // Try to add the column with NULL first
    console.log('Step 1: Adding userId column (nullable)...');
    await prisma.$executeRaw`ALTER TABLE analytics ADD COLUMN "userId" VARCHAR(255)`;
    console.log('✅ Column added!');
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log('✅ Column already exists');
    } else {
      console.log('❌ Error adding column:', e.message);
    }
  }

  // Now let's see the current state
  console.log('\nChecking analytics table...');
  try {
    const records = await prisma.$queryRaw`SELECT id, "userId", platform FROM analytics LIMIT 5`;
    console.log('Sample records:');
    console.log(records);
  } catch (e) {
    console.log('Error:', e.message);
  }

  await prisma.$disconnect();
}

addUserIdColumn().catch(e => { console.log('ERROR:', e.message); prisma.$disconnect(); });