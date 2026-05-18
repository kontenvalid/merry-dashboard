/**
 * Migration Script: Env API Keys → Per-User Database Keys
 * 
 * This script migrates API keys from environment variables to the database
 * for each user, ensuring proper per-user isolation.
 * 
 * Usage:
 *   npx tsx prisma/migrate-api-keys.ts
 * 
 * Environment variables needed (for connecting to DB):
 *   DATABASE_URL - PostgreSQL connection string
 */

import prisma from '../src/lib/prisma';
import { encodeKey } from '../src/lib/api-key-store';

// Configuration
const ADMIN_EMAIL = 'kontenval.id@gmail.com';

// API keys from environment (the ones that were used as fallback)
const ENV_API_KEYS = {
  composio: process.env.COMPOSIO_API_KEY || '',
  meta_token: process.env.META_ACCESS_TOKEN || '',
  zernio_api_key: process.env.ZERNIO_API_KEY || '',
};

async function migrateApiKeys() {
  console.log('🚀 Starting API Key Migration...\n');

  // 1. Get admin user
  console.log(`📧 Looking for admin user: ${ADMIN_EMAIL}`);
  const adminUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (!adminUser) {
    console.error('❌ Admin user not found! Make sure the user exists in the database.');
    console.error('   Run "npx prisma db push" first to sync the schema.');
    process.exit(1);
  }

  console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.id})`);
  console.log('');

  // 2. Check existing keys in DB
  const existingKeys = await prisma.apiKey.findMany({
    where: { userId: adminUser.id },
  });

  console.log(`📊 Current API keys in DB for admin: ${existingKeys.length}`);
  for (const key of existingKeys) {
    console.log(`   - ${key.service}: ${key.isActive ? 'active' : 'inactive'}`);
  }
  console.log('');

  // 3. Migrate each API key from env to DB
  const services = [
    {
      envKey: 'composio',
      serviceName: 'composio',
      displayName: 'Composio (X Consumer API Key)',
      required: true
    },
    {
      envKey: 'meta_token',
      serviceName: 'meta_graph',
      displayName: 'Meta Graph API (Access Token)',
      required: false
    },
    {
      envKey: 'zernio_api_key',
      serviceName: 'zernio',
      displayName: 'Zernio API',
      required: false
    },
  ];

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const service of services) {
    const envValue = ENV_API_KEYS[service.envKey as keyof typeof ENV_API_KEYS];

    if (!envValue || envValue.trim() === '') {
      if (service.required) {
        console.log(`⚠️  ${service.displayName}: No value in env, skipping...`);
      } else {
        console.log(`⏭️  ${service.displayName}: No value in env (optional), skipping...`);
      }
      skipped++;
      continue;
    }

    console.log(`\n🔑 Migrating: ${service.displayName}`);
    console.log(`   Env var: ${service.envKey}`);
    console.log(`   Length: ${envValue.length} chars`);

    try {
      // Check if already exists
      const existing = existingKeys.find(k => k.service === service.serviceName);
      
      if (existing) {
        console.log(`   ⚠️  Key already exists in DB, updating...`);
        await prisma.apiKey.update({
          where: { id: existing.id },
          data: {
            apiKey: encodeKey(envValue),
            isActive: true,
            updatedAt: new Date(),
          },
        });
      } else {
        console.log(`   💾 Creating new entry...`);
        await prisma.apiKey.create({
          data: {
            userId: adminUser.id,
            service: service.serviceName,
            apiKey: encodeKey(envValue),
            isActive: true,
            metadata: {
              migrated: true,
              migratedAt: new Date().toISOString(),
              migratedFrom: 'environment_variable',
              envVarName: service.envKey,
            },
          },
        });
      }

      console.log(`   ✅ Migrated successfully!`);
      migrated++;
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
      errors++;
    }
  }

  // 4. Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 Migration Summary');
  console.log('='.repeat(50));
  console.log(`✅ Migrated: ${migrated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('');

  // 5. Verify migration
  const finalKeys = await prisma.apiKey.findMany({
    where: { userId: adminUser.id, isActive: true },
    select: { service: true, metadata: true, updatedAt: true }
  });

  console.log(`📊 Final API keys in DB for admin: ${finalKeys.length}`);
  for (const key of finalKeys) {
    const meta = key.metadata as any;
    const migrated = meta?.migrated ? ' (migrated)' : '';
    console.log(`   ✅ ${key.service}${migrated}`);
  }

  console.log('\n🎉 Migration complete!');
  console.log('\n📝 Note: You can now safely remove API keys from .env file.');
  console.log('    Each user should configure their own API keys in Settings page.');

  await prisma.$disconnect();
}

// Run migration
migrateApiKeys().catch((error) => {
  console.error('❌ Migration failed:', error);
  prisma.$disconnect();
  process.exit(1);
});
