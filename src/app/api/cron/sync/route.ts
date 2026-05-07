import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getApiKey } from '@/lib/api-key-store'
import { fetchAllSocialData, fetchGoogleDriveFiles, testMcpConnection, SocialMediaData, GoogleDriveFile } from '@/lib/composio-mcp'

// Meta Ads accounts
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]
const META_API_BASE = 'https://graph.facebook.com/v21.0'

// Fetch Meta Ads data directly from Graph API
async function fetchMetaAdsData(accessToken: string) {
  const campaigns: any[] = []
  let totalSpend = 0

  for (const account of META_ADS_ACCOUNTS) {
    try {
      const campaignsRes = await fetch(
        `${META_API_BASE}/${account.id}/campaigns?fields=id,name,status,daily_budget,spend&access_token=${accessToken}`
      )

      if (!campaignsRes.ok) continue

      const campaignsData = await campaignsRes.json()

      for (const campaign of campaignsData.data || []) {
        const insightsRes = await fetch(
          `${META_API_BASE}/${campaign.id}/insights?fields=spend,impressions,clicks&access_token=${accessToken}`
        )

        let insights: any = {}
        if (insightsRes.ok) {
          const insightsData = await insightsRes.json()
          insights = insightsData.data?.[0] || {}
        }

        const spend = parseFloat(insights.spend || campaign.spend || '0')
        campaigns.push({
          accountId: account.id,
          accountName: account.name,
          currency: account.currency,
          name: campaign.name,
          status: campaign.status,
          spend,
          impressions: parseInt(insights.impressions || '0'),
          clicks: parseInt(insights.clicks || '0')
        })

        totalSpend += spend
      }
    } catch (e) {
      console.warn(`Meta Ads fetch error for ${account.id}:`, e)
    }
  }

  return { campaigns, totalSpend }
}

// Main sync function
export async function runSync(userId: string = 'kontenval.id@gmail.com') {
  console.log('🔄 Starting sync for user:', userId)
  
  const results: any = {
    syncedAt: new Date().toISOString(),
    socialMedia: [],
    metaAds: null,
    googleDrive: null,
    errors: []
  }

  // Get API keys
  const apiKey = await getApiKey(userId, 'composio')
  const metaToken = await getApiKey(userId, 'meta_graph')

  // 1. Fetch social media data via Composio MCP
  if (apiKey) {
    const connectionTest = await testMcpConnection(apiKey)
    if (connectionTest.success) {
      const socialData = await fetchAllSocialData(apiKey)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (const data of socialData) {
        try {
          await prisma.analytics.upsert({
            where: {
              platform_date: {
                platform: data.platform,
                date: today
              }
            },
            update: {
              followers: data.followers,
              following: data.following,
              posts: data.posts,
              engagement: data.engagement,
              reach: data.reach,
              impressions: data.impressions,
              likes: data.likes,
              comments: data.comments,
              shares: data.shares,
              views: data.views,
              watchTime: data.watchTime,
            },
            create: {
              platform: data.platform,
              date: today,
              followers: data.followers,
              following: data.following,
              posts: data.posts,
              engagement: data.engagement,
              reach: data.reach,
              impressions: data.impressions,
              likes: data.likes,
              comments: data.comments,
              shares: data.shares,
              views: data.views,
              watchTime: data.watchTime,
            }
          })
          results.socialMedia.push({ platform: data.platform, success: true, data })
          console.log(`✅ ${data.platform}: ${data.followers} followers`)
        } catch (dbError: any) {
          console.error(`❌ ${data.platform} save failed:`, dbError.message)
          results.errors.push({ platform: data.platform, error: dbError.message })
        }
      }
    } else {
      console.error('❌ MCP connection failed:', connectionTest.error)
      results.errors.push({ error: 'MCP connection failed', details: connectionTest.error })
    }
  } else {
    console.warn('⚠️ No Composio API key')
    results.errors.push({ error: 'No Composio API key configured' })
  }

  // 2. Fetch Meta Ads data directly via Graph API
  if (metaToken) {
    console.log('📊 Fetching Meta Ads...')
    const metaAdsData = await fetchMetaAdsData(metaToken)

    const metaAdsJson = JSON.stringify({
      campaigns: metaAdsData.campaigns,
      totalSpend: metaAdsData.totalSpend,
      lastUpdated: new Date().toISOString()
    })

    await prisma.dashboardSettings.upsert({
      where: { userId },
      update: { metaAdsData: metaAdsJson },
      create: { 
        userId, 
        metaAdsData: metaAdsJson,
        timezone: 'gdrive'
      }
    })

    results.metaAds = {
      success: true,
      campaigns: metaAdsData.campaigns.length,
      totalSpend: metaAdsData.totalSpend
    }
    console.log(`✅ Meta Ads: ${metaAdsData.campaigns.length} campaigns, $${metaAdsData.totalSpend.toFixed(2)} spend`)
  } else {
    console.warn('⚠️ No Meta Graph API token')
    results.errors.push({ error: 'No Meta Graph API token configured' })
  }

  // 3. Fetch Google Drive files via Composio MCP
  if (apiKey) {
    console.log('📁 Fetching Google Drive...')
    const gdriveResult = await fetchGoogleDriveFiles(apiKey)
    if (gdriveResult.success) {
      await prisma.dashboardSettings.upsert({
        where: { userId },
        update: { 
          timezone: 'gdrive',
          googleDriveData: JSON.stringify({ fileCount: gdriveResult.files.length })
        },
        create: { 
          userId, 
          timezone: 'gdrive',
          googleDriveData: JSON.stringify({ fileCount: gdriveResult.files.length })
        }
      })
      results.googleDrive = {
        success: true,
        fileCount: gdriveResult.files.length
      }
      console.log(`✅ Google Drive: ${gdriveResult.files.length} files`)
    } else {
      results.googleDrive = { success: false, error: gdriveResult.error }
      console.warn('⚠️ Google Drive fetch failed:', gdriveResult.error)
    }
  }

  console.log('🏁 Sync completed:', results)
  return results
}

// GET - Manual trigger or auto-sync
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'kontenval.id@gmail.com'

    const results = await runSync(userId)

    return NextResponse.json({
      success: results.errors.length === 0,
      ...results
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// POST
export async function POST(request: Request) {
  return GET(request)
}