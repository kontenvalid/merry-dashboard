const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== Checking Meta Token ===\n')
  
  // Get all API keys and decode them
  const keys = await prisma.apiKey.findMany({})
  
  for (const k of keys) {
    console.log(`Service: ${k.service}`)
    console.log(`  UserId: ${k.userId}`)
    console.log(`  Active: ${k.isActive}`)
    
    if (k.apiKey) {
      // Decode the key
      const decoded = Buffer.from(k.apiKey, 'base64').toString('utf8')
      console.log(`  Key (decoded): ${decoded.substring(0, 20)}...`)
    }
  }
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })