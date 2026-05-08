const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== All API Keys ===\n')
  const keys = await prisma.apiKey.findMany({})
  
  for (const k of keys) {
    console.log(`Service: ${k.service}`)
    console.log(`  UserId: ${k.userId}`)
    console.log(`  Active: ${k.isActive}`)
    console.log(`  Has Key: ${k.apiKey ? 'YES (encoded)' : 'NO'}`)
    console.log(`  Metadata: ${JSON.stringify(k.metadata)}`)
    console.log('')
  }
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })