// Debug why overview is returning empty data
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debug() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  console.log('Today:', today.toISOString())

  // Check analytics for today
  const analyticsRecords = await prisma.analytics.findMany({
    where: { date: today }
  })
  console.log('\nAnalytics for today:', analyticsRecords.length)
  for (const r of analyticsRecords) {
    console.log(`- ${r.platform}: followers=${r.followers}, posts=${r.posts}`)
  }

  // Check settings
  const metaAdsSettings = await prisma.dashboardSettings.findUnique({
    where: { id: 'metaAds' }
  })
  console.log('\nMetaAds settings:', metaAdsSettings ? 'found' : 'not found')
  if (metaAdsSettings?.metaAdsData) {
    const parsed = JSON.parse(metaAdsSettings.metaAdsData)
    console.log('MetaAds campaigns:', parsed.campaigns?.length || 0)
    console.log('MetaAds totalSpend:', parsed.totalSpend)
  }

  const gdriveSettings = await prisma.dashboardSettings.findUnique({
    where: { id: 'gdrive' }
  })
  console.log('\nGdrive settings:', gdriveSettings ? 'found' : 'not found')
  if (gdriveSettings?.googleDriveData) {
    const parsed = JSON.parse(gdriveSettings.googleDriveData)
    console.log('Files:', parsed.fileCount)
  }

  // Simulate overview logic
  console.log('\n=== Simulating overview logic ===')
  const data = {
    facebook: { followers: 0, posts: 0 },
    instagram: { followers: 0, posts: 0 },
    youtube: { followers: 0, posts: 0 }
  }

  for (const record of analyticsRecords) {
    switch (record.platform) {
      case 'FACEBOOK':
        data.facebook = {
          followers: record.followers,
          posts: record.posts,
          likes: record.likes,
          comments: record.comments
        }
        break
      case 'INSTAGRAM':
        data.instagram = {
          followers: record.followers,
          posts: record.posts,
          likes: record.likes,
          comments: record.comments
        }
        break
      case 'YOUTUBE':
        data.youtube = {
          followers: record.followers,
          posts: record.posts,
          views: record.views
        }
        break
    }
  }

  console.log('\nResult data:', JSON.stringify(data, null, 2))
}

debug()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect() })