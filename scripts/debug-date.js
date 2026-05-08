const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0))
  
  console.log('Today (UTC):', todayUTC.toISOString())
  
  // Query with exact UTC date
  const records = await prisma.analytics.findMany({
    where: {
      date: todayUTC
    }
  })
  
  console.log('Records found:', records.length)
  for (const r of records) {
    console.log(`  ${r.platform}: followers=${r.followers}, posts=${r.posts}`)
  }
  
  // Try without filter
  const allRecords = await prisma.analytics.findMany({
    take: 5,
    orderBy: { date: 'desc' }
  })
  
  console.log('\nAll recent records:')
  for (const r of allRecords) {
    console.log(`  ${r.platform}: ${r.date.toISOString()} - followers=${r.followers}, posts=${r.posts}`)
  }
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })