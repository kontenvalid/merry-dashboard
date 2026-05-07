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

// GET - Cron sync endpoint (called by scheduler or manual trigger)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'kontenval.id@gmail.com'

    // Get Composio API key
    const apiKey = await getApiKey(userId, 'composio')

    // Get Meta Graph API token
    const metaToken = await getApiKey(userId, 'meta_graph')

    const results: any = {
      syncedAt: new Date().toISOString(),
      socialMedia: [],
      metaAds: null,
      googleDrive: null,
      errors: []
    }

    // 1. Fetch social media data via Composio MCP
    if (apiKey) {
      // Test connection first
      const connectionTest = await testMcpConnection(apiKey)
      if (connectionTest.success) {
        // Fetch all social media data
        const socialData = await fetchAllSocialData(apiKey)

        // Store social media data in database
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
            results.socialMedia.push({ platform: data.platform, success: true })
          } catch (dbError: any) {
            results.errors.push({ platform: data.platform, error: dbError.message })
          }
        }
      } else {
        results.errors.push({ error: 'MCP connection failed', details: connectionTest.error })
      }
    } else {
      results.errors.push({ error: 'No Composio API key configured' })
    }

    // 2. Fetch Meta Ads data directly via Graph API
    if (metaToken) {
      const metaAdsData = await fetchMetaAdsData(metaToken)

      // Store Meta Ads summary in a settings field (or separate table if needed)
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
          timezone: '' // Placeholder for GDrive folder ID
        }
      })

      results.metaAds = {
        success: true,
        campaigns: metaAdsData.campaigns.length,
        totalSpend: metaAdsData.totalSpend
      }
    } else {
      results.errors.push({ error: 'No Meta Graph API token configured' })
    }

    // 3. Fetch Google Drive files via Composio MCP
    if (apiKey) {
      const gdriveResult = await fetchGoogleDriveFiles(apiKey)
      if (gdriveResult.success) {
        // Update GDrive file count in settings
        await prisma.dashboardSettings.upsert({
          where: { userId },
          update: { timezone: gdriveResult.folderId || 'default' },
          create: { 
            userId, 
            timezone: gdriveResult.folderId || 'default',
            googleDriveData: JSON.stringify({ fileCount: gdriveResult.files.length })
          }
        })
        results.googleDrive = {
          success: true,
          fileCount: gdriveResult.files.length
        }
      } else {
        results.googleDrive = { success: false, error: gdriveResult.error }
      }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      ...results
    })
  } catch (error: any) {
    console.error('Cron sync error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// POST - Also allow POST for webhook triggers
export async function POST(request: Request) {
  return GET(request)
}