const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const composioToken = 'ck_81LPoF-vaCnWO8LTJ1nF'
const userId = 'cmopvdcrn00004e1xbsct0hbq'

async function main() {
  const encoded = Buffer.from(composioToken).toString('base64')
  
  await prisma.apiKey.upsert({
    where: { userId_service: { userId, service: 'composio' } },
    update: { apiKey: encoded, isActive: true },
    create: { userId, service: 'composio', apiKey: encoded, isActive: true }
  })
  
  console.log('✅ Composio token updated!')
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })