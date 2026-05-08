// Debug database contents
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  console.log('=== ANALYTICS TABLE ===')
  const analytics = await prisma.analytics.findMany({ orderBy: { date: 'desc' }, take: 5 })
  console.log(`Found ${analytics.length} records`)
  console.log(JSON.stringify(analytics, null, 2))
  
  console.log('\n=== DASHBOARD_SETTINGS TABLE ===')
  const settings = await prisma.dashboardSettings.findMany()
  console.log(`Found ${settings.length} records`)
  for (const s of settings) {
    console.log(`- ${s.id}: ${s.metaAdsData ? 'has metaAdsData' : 'no metaAdsData'}`)
    console.log(`  googleDriveData: ${s.googleDriveData ? 'present' : 'none'}`)
  }
}

check()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect() })