// Shared dashboard data service
// Reads from database (cached from cron) and composes for UI

import prisma from './prisma'
import { getApiKey } from './api-key-store'
import { PlatformData, DashboardData } from './types'

// Platform IDs
const FB_PAGE_ID = '1080250281836384'
const IG_USER_ID = '27556603287273697'
const YT_CHANNEL_ID = 'UCK2C25kK4E3PR6w0gPNCjaA'

// Meta Ads accounts
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]

// Get today's date (date only)
function getTodayDate() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

// Fetch dashboard data from database
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const result: DashboardData = {
    facebook: { connected: false, name: 'Facebook', handle: '@kontenval.id' },
    instagram: { connected: false, name: 'Instagram', handle: '@kontenval.id' },
    youtube: { connected: false, name: 'YouTube', handle: '@kontenvalid' },
    metaAds: { connected: false, accounts: META_ADS_ACCOUNTS, campaigns: [], summary: { totalSpend: 0, totalCampaigns: 0, avgCPC: 0 } },
    googleDrive: { connected: false, fileCount: 0 },
    timestamp: new Date().toISOString(),
    source: 'database'
  }

  try {
    const today = getTodayDate()

    // Fetch analytics data from database (cached from cron)
    const analyticsRecords = await prisma.analytics.findMany({
      where: {
        date: today
      }
    })

    // Map database records to dashboard format
    for (const record of analyticsRecords) {
      switch (record.platform) {
        case 'FACEBOOK':
          result.facebook = {
            connected: record.followers > 0,
            name: 'Facebook Page',
            handle: '@kontenval.id',
            followers: record.followers,
            posts: record.posts,
            engagement: record.engagement,
            reach: record.reach,
            link: 'https://www.facebook.com/kontenval.id',
            engagement: {
              likes: record.likes,
              comments: record.comments,
              shares: record.shares,
            },
            posts: {
              reach: record.reach,
              impressions: record.impressions,
            }
          }
          break
        case 'INSTAGRAM':
          result.instagram = {
            connected: record.followers > 0,
            name: 'Instagram',
            handle: '@kontenval.id',
            followers: record.followers,
            posts: record.posts,
            engagement: record.engagement,
            mediaCount: record.posts,
            engagement: {
              likes: record.likes,
              comments: record.comments,
            },
            posts: {
              reach: record.reach,
              impressions: record.impressions,
            }
          }
          break
        case 'YOUTUBE':
          result.youtube = {
            connected: record.subscribers > 0 || record.followers > 0,
            name: 'YouTube Channel',
            handle: '@kontenvalid',
            subscribers: record.subscribers || record.followers,
            videoCount: record.posts,
            viewCount: record.views,
            views: record.views,
            engagement: {
              likes: record.likes,
              comments: record.comments,
            }
          }
          break
      }
    }

    // Check if we have data - if not, mark source as empty
    if (analyticsRecords.length === 0) {
      result.source = 'no_data'
    }

    // Try to get Meta Ads data
    const metaToken = await getApiKey(userId, 'meta_graph')
    if (metaToken) {
      result.metaAds = await fetchMetaAdsData(metaToken)
    }

    return result
  } catch (error: any) {
    console.error('Dashboard data fetch error:', error)
    result.source = 'error'
    return result
  }
}

// Fetch Meta Ads data
async function fetchMetaAdsData(accessToken: string) {
  const campaigns: any[] = []
  let totalSpend = 0

  for (const account of META_ADS_ACCOUNTS) {
    try {
      const campaignsRes = await fetch(
        `https://graph.facebook.com/v21.0/${account.id}/campaigns?fields=id,name,status,daily_budget,spend&access_token=${accessToken}`
      )
      
      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        
        for (const campaign of data.data || []) {
          const insightsRes = await fetch(
            `https://graph.facebook.com/v21.0/${campaign.id}/insights?fields=spend,impressions,clicks&access_token=${accessToken}`
          )
          
          const insights: any = {}
          if (insightsRes.ok) {
            const insightsData = await insightsRes.json()
            Object.assign(insights, insightsData.data?.[0] || {})
          }

          const spend = parseFloat(insights.spend || campaign.spend || '0')
          campaigns.push({
            accountId: account.id,
            accountName: account.name,
            currency: account.currency,
            name: campaign.name,
            status: campaign.status,
            spend: spend || undefined,
            impressions: parseInt(insights.impressions || '0') || undefined,
            clicks: parseInt(insights.clicks || '0') || undefined,
          })

          totalSpend += spend
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch campaigns for ${account.id}`)
    }
  }

  return {
    connected: campaigns.length > 0 || !!accessToken,
    accounts: META_ADS_ACCOUNTS,
    campaigns,
    summary: {
      totalSpend,
      totalCampaigns: campaigns.length,
      avgCPC: campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0) > 0 
        ? totalSpend / campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0) 
        : 0
    }
  }
}

// Helper functions
export function displayValue(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}

export function calculateTotalFollowers(data: DashboardData): number {
  let total = 0
  if (data.facebook.followers) total += data.facebook.followers
  if (data.instagram.followers) total += data.instagram.followers
  if (data.youtube.subscribers) total += data.youtube.subscribers
  return total || 0
}