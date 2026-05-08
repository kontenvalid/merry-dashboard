const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== API Keys in Database ===\n')
  const keys = await prisma.apiKey.findMany({
    select: { userId: true, service: true, isActive: true, metadata: true }
  })
  
  if (keys.length === 0) {
    console.log('No API keys found in database')
  } else {
    for (const k of keys) {
      console.log(`- ${k.service} (${k.userId}): ${k.isActive ? 'ACTIVE' : 'inactive'}`)
    }
  }
  
  // Check if composio key is stored
  const composioKey = await prisma.apiKey.findUnique({
    where: { userId_service: { userId: 'kontenval.id@gmail.com', service: 'composio' } }
  })
  console.log('\nComposio key stored:', composioKey ? 'YES' : 'NO')
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })