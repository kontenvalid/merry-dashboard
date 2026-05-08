const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const records = await prisma.analytics.findMany({
    orderBy: { date: 'desc' },
    take: 5
  })
  
  console.log('Recent analytics:')
  for (const r of records) {
    console.log(`- ${r.platform}: ${r.date.toISOString()} followers=${r.followers} posts=${r.posts}`)
  }
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })