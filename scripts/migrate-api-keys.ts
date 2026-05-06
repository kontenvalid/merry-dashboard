import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Migration: Copy API keys from .env to database for existing users
async function migrateApiKeys() {
  console.log("Starting API key migration...");

  // Get the admin user
  const adminUser = await prisma.user.findFirst({
    where: { email: "kontenval.id@gmail.com" }
  });

  if (!adminUser) {
    console.log("Admin user not found. Please run auth setup first.");
    return;
  }

  const userId = adminUser.id;

  // Composio API Key
  const composioKey = process.env.COMPOSIO_API_KEY;
  if (composioKey && composioKey !== "your-composio-api-key-here" && composioKey !== "") {
    const encodedKey = Buffer.from(composioKey).toString('base64');
    
    await prisma.apiKey.upsert({
      where: { userId_service: { userId, service: 'composio' } },
      update: { apiKey: encodedKey, isActive: true },
      create: { 
        userId, 
        service: 'composio', 
        apiKey: encodedKey,
        metadata: { migratedAt: new Date().toISOString() }
      }
    });
    console.log("✅ Composio API key migrated");
  } else {
    console.log("⚠️ No Composio API key in .env to migrate");
  }

  // Meta Access Token
  const metaToken = process.env.META_ACCESS_TOKEN;
  if (metaToken && metaToken !== "") {
    const encodedKey = Buffer.from(metaToken).toString('base64');
    
    await prisma.apiKey.upsert({
      where: { userId_service: { userId, service: 'meta_graph' } },
      update: { apiKey: encodedKey, isActive: true },
      create: { 
        userId, 
        service: 'meta_graph', 
        apiKey: encodedKey,
        metadata: { migratedAt: new Date().toISOString() }
      }
    });
    console.log("✅ Meta Access Token migrated");
  } else {
    console.log("⚠️ No Meta Access Token in .env to migrate");
  }

  console.log("Migration complete!");
}

migrateApiKeys()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
