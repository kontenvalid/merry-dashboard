const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const newToken = 'EAAYO8KU9nKgBRYBLCzsdj9eNfaIm2ZCjZAsi0uFOd8rlybMa7zZCm97r25OZBLtb8BfQSPevY8b9Tp3qpkz49DHYsRR2nz7vycMItvMRsJ6z0ZBLh3GL2kIdfDOGe0ktglsKsm0xCGmRgniL2LHPbXpahlZA2spjwYn7BTqnuVSGPvlkMyTdDZBzIU6mUAS6QZDZD'
const userId = 'cmopvdcrn00004e1xbsct0hbq'

async function main() {
  // Update or create the token
  const encoded = Buffer.from(newToken).toString('base64')
  
  await prisma.apiKey.upsert({
    where: { userId_service: { userId, service: 'meta_graph' } },
    update: { apiKey: encoded, isActive: true },
    create: { userId, service: 'meta_graph', apiKey: encoded, isActive: true }
  })
  
  console.log('✅ Token updated!')
  
  // Verify
  const key = await prisma.apiKey.findUnique({
    where: { userId_service: { userId, service: 'meta_graph' } }
  })
  console.log('Token stored:', key?.apiKey?.substring(0, 20) + '...')
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })