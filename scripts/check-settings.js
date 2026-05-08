const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const settings = await prisma.dashboardSettings.findFirst()
  console.log('Settings:', JSON.stringify(settings, null, 2))
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })