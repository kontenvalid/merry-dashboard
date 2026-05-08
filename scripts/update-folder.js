const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const settingsId = 'cmott7kzz0000lkbg4otap7wa' // From earlier query
const folderId = '1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF' // Composio/Ebook folder

async function main() {
  await prisma.dashboardSettings.update({
    where: { id: settingsId },
    data: { timezone: folderId }
  })
  console.log('✅ Updated folder ID to:', folderId)
  console.log('Link: https://drive.google.com/drive/folders/' + folderId)
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })