const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const newToken = 'EAAYO8KU9nKgBRY03m5bpGVMcLXszuSasCUZB1aExx15ubB2xXFLVLHpzW7VB6iPnEoVwitq8IPptqSXwx1K9ZCSQ5MbfkmtAbn3Fj4ueGKv2YyDpbCjwXmM8Il9HZBIgb3NZA3KoxrbjMZCLgGtZB4aHaj0c1u96CkdLK5LVoBLCf4crIW0WiSmVXkx0N3yQZDZD'
const userId = 'cmopvdcrn00004e1xbsct0hbq'

async function main() {
  const encoded = Buffer.from(newToken).toString('base64')
  
  await prisma.apiKey.upsert({
    where: { userId_service: { userId, service: 'meta_graph' } },
    update: { apiKey: encoded, isActive: true },
    create: { userId, service: 'meta_graph', apiKey: encoded, isActive: true }
  })
  
  console.log('✅ Token updated!')
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })