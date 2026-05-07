// Shared dashboard data service
// Ensures consistent data across all pages (dashboard, analytics, social, ads)
// Social media via Composio, Meta Ads via direct Graph API (fallback)

import { getApiKey } from './api-key-store'

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

export interface PlatformData {
  connected: boolean;
  name: string;
  handle: string;
  followers?: number;
  subscribers?: number;
  reach?: number;
  views?: number;
  engagement?: {
    likes?: number;
    comments?: number;
    saves?: number;
    shares?: number;
  };
  posts?: { reach?: number; impressions?: number };
  mediaCount?: number;
  videoCount?: number;
  viewCount?: number;
  link?: string;
  // Raw data for debugging
  raw?: any;
}

export interface DashboardData {
  facebook: PlatformData;
  instagram: PlatformData;
  youtube: PlatformData;
  metaAds: {
    connected: boolean;
    accounts: typeof META_ADS_ACCOUNTS;
    campaigns: any[];
    summary: {
      totalSpend: number;
      totalCampaigns: number;
      avgCPC: number;
    };
  };
  googleDrive: {
    connected: boolean;
    fileCount: number;
  };
  timestamp: string;
  source: string;
}

// Fetch all dashboard data from APIs
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const result: DashboardData = {
    facebook: { connected: false, name: 'Facebook', handle: '@kontenval.id' },
    instagram: { connected: false, name: 'Instagram', handle: '@kontenval.id' },
    youtube: { connected: false, name: 'YouTube', handle: '@kontenvalid' },
    metaAds: { connected: false, accounts: META_ADS_ACCOUNTS, campaigns: [], summary: { totalSpend: 0, totalCampaigns: 0, avgCPC: 0 } },
    googleDrive: { connected: false, fileCount: 0 },
    timestamp: new Date().toISOString(),
    source: 'unknown'
  }

  try {
    // Get API keys from database - both composio and meta_graph
    const apiKey = await getApiKey(userId, 'composio') || process.env.COMPOSIO_API_KEY
    const metaToken = await getApiKey(userId, 'meta_graph') || process.env.META_ACCESS_TOKEN
    
    // If no API keys configured, return empty result
    if (!apiKey && !metaToken) {
      console.log('No API keys configured for user:', userId)
      result.source = 'no_keys'
      return result
    }

    // Fetch all data in parallel (only fetch if key exists)
    const promises: Promise<void>[] = []
    
    // Social media via Composio
    if (apiKey) {
      promises.push(
        fetchFacebookData(apiKey).then(data => {
          if (data) result.facebook = data
        }).catch(err => console.warn('Facebook fetch failed:', err))
      )
      promises.push(
        fetchInstagramData(apiKey).then(data => {
          if (data) result.instagram = data
        }).catch(err => console.warn('Instagram fetch failed:', err))
      )
      promises.push(
        fetchYoutubeData(apiKey).then(data => {
          if (data) result.youtube = data
        }).catch(err => console.warn('YouTube fetch failed:', err))
      )
    }
    
    // Meta Ads via direct Graph API
    if (metaToken) {
      promises.push(
        fetchMetaAdsData(metaToken).then(data => {
          result.metaAds = data
        }).catch(err => console.warn('Meta Ads fetch failed:', err))
      )
    }
    
    await Promise.all(promises)
    
    result.source = apiKey ? 'composio_direct' : 'meta_graph_only'
    return result
  } catch (error: any) {
    console.error('Dashboard data fetch error:', error)
    result.source = 'error'
    return result
  }
}

// ============================================
// COMPOSIO - Social Media (Facebook, Instagram, YouTube)
// These work via Composio MCP
// ============================================

async function fetchFacebookData(apiKey: string): Promise<PlatformData> {
  try {
    const [detailsRes, insightsRes] = await Promise.all([
      fetch(`https://backend.composio.dev/api/v3.1/tools/execute/facebook_graph_get_page_details`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'me', arguments: { page_id: FB_PAGE_ID } })
      }),
      fetch(`https://backend.composio.dev/api/v3.1/tools/execute/facebook_graph_page_insights`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'me', 
          arguments: { 
            page_id: FB_PAGE_ID,
            metrics: 'page_follows,page_post_engagements,page_impressions,page_reach'
          }
        })
      })
    ])

    const details = await detailsRes.json()
    const insights = await insightsRes.json()

    // Handle Composio response format
    let pageData: any = {}
    let metrics: any = {}

    // Try different response structures
    if (details.data?.data) {
      pageData = details.data.data
    } else if (details.data) {
      pageData = details.data
    }

    if (insights.data?.data?.[0]?.values?.[0]?.value) {
      metrics = insights.data.data[0].values[0].value
    } else if (insights.data?.data?.[0]) {
      metrics = insights.data.data[0]
    }

    // Get followers from various possible field names
    const followers = metrics.page_follows 
      || pageData.followers_count 
      || pageData.followers 
      || undefined

    // Return real data with connected: true, NOT filling with 0 if empty
    return {
      connected: true, // Mark as connected when data is successfully fetched
      name: pageData.name || 'Facebook Page',
      handle: pageData.username ? `@${pageData.username}` : '@kontenval.id',
      followers: followers,
      reach: metrics.page_reach || undefined,
      engagement: {
        likes: metrics.page_post_engagements || undefined,
        comments: undefined,
      },
      posts: {
        reach: metrics.page_reach || undefined,
        impressions: metrics.page_impressions || undefined,
      },
      link: `https://www.facebook.com/${pageData.username || pageData.id}`,
      raw: { pageData, metrics }
    }
  } catch (error) {
    console.error('Facebook fetch error:', error)
    return { connected: false, name: 'Facebook', handle: '@kontenval.id' }
  }
}

async function fetchInstagramData(apiKey: string): Promise<PlatformData> {
  try {
    const [profileRes, mediaRes] = await Promise.all([
      fetch(`https://backend.composio.dev/api/v3.1/tools/execute/INSTAGRAM_GET_USER_INFO`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'me', arguments: { ig_user_id: IG_USER_ID } })
      }),
      fetch(`https://backend.composio.dev/api/v3.1/tools/execute/INSTAGRAM_GET_USER_MEDIA`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'me', arguments: { ig_user_id: IG_USER_ID } })
      })
    ])

    const profile = await profileRes.json()
    const media = await mediaRes.json()

    // Handle different response structures
    let profileData: any = {}
    let mediaData: any[] = []

    if (profile.data?.data) {
      profileData = profile.data.data
    } else if (profile.data) {
      profileData = profile.data
    }

    if (media.data?.data) {
      mediaData = media.data.data
    } else if (media.data) {
      mediaData = Array.isArray(media.data) ? media.data : media.data.data || []
    }

    // Calculate totals from media
    const totalLikes = mediaData.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0)
    const totalComments = mediaData.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0)

    // Get followers from various possible field names (API may return different names)
    const followers = profileData.followers_count 
      || profileData.followers 
      || profileData.follower_count
      || undefined

    // Return real data with connected: true, NOT filling with 0 if empty
    return {
      connected: true, // Mark as connected when data is successfully fetched
      name: profileData.username || 'instagram',
      handle: `@${profileData.username || 'kontenval.id'}`,
      followers: followers,
      mediaCount: profileData.media_count || profileData.media_count || mediaData.length || undefined,
      engagement: {
        likes: totalLikes || undefined,
        comments: totalComments || undefined,
      },
      posts: {
        reach: undefined,
        impressions: undefined,
      },
      link: `https://instagram.com/${profileData.username || ''}`,
      raw: { profileData, mediaCount: mediaData.length }
    }
  } catch (error) {
    console.error('Instagram fetch error:', error)
    return { connected: false, name: 'Instagram', handle: '@kontenval.id' }
  }
}

async function fetchYoutubeData(apiKey: string): Promise<PlatformData> {
  try {
    const res = await fetch(`https://backend.composio.dev/api/v3.1/tools/execute/YOUTUBE_GET_CHANNEL_STATISTICS`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: 'me', 
        arguments: { 
          channel_id: YT_CHANNEL_ID,
          parts: 'snippet,statistics,contentDetails'
        }
      })
    })

    const data = await res.json()
    
    // Handle different response structures
    let channel: any = {}
    
    if (data.data?.data) {
      channel = data.data.data
    } else if (data.data) {
      channel = data.data
    }

    // Return real data, NOT filling with 0 if empty
    return {
      connected: true,
      name: channel.snippet?.title || 'YouTube Channel',
      handle: channel.snippet?.customUrl ? `@${channel.snippet.customUrl.replace('@', '')}` : '@kontenvalid',
      subscribers: parseInt(channel.statistics?.subscriberCount || '0') || undefined,
      videoCount: parseInt(channel.statistics?.videoCount || '0') || undefined,
      viewCount: parseInt(channel.statistics?.viewCount || '0') || undefined,
      views: parseInt(channel.statistics?.viewCount || '0') || undefined,
      engagement: {
        likes: undefined,
        comments: parseInt(channel.statistics?.commentCount || '0') || undefined,
      },
      posts: {},
      link: `https://youtube.com/@${channel.snippet?.customUrl?.replace('@', '') || ''}`,
      raw: channel
    }
  } catch (error) {
    console.error('YouTube fetch error:', error)
    return { connected: false, name: 'YouTube', handle: '@kontenvalid' }
  }
}

// ============================================
// DIRECT GRAPH API - Meta Ads (fallback)
// ============================================

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
          // Get insights for each campaign
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
            budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : undefined,
            spend: spend || undefined,
            impressions: parseInt(insights.impressions || '0') || undefined,
            clicks: parseInt(insights.clicks || '0') || undefined,
            cpc: insights.clicks > 0 ? spend / insights.clicks : undefined,
          })

          totalSpend += spend
        }
      } else {
        const errData = await campaignsRes.json()
        console.warn(`Meta Ads account ${account.id}:`, errData)
      }
    } catch (e) {
      console.warn(`Failed to fetch campaigns for ${account.id}`)
    }
  }

  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0)

  return {
    connected: campaigns.length > 0,
    accounts: META_ADS_ACCOUNTS,
    campaigns,
    summary: {
      totalSpend,
      totalCampaigns: campaigns.length,
      avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0
    }
  }
}

// Helper to safely get value or return null (not 0)
export function safeValue<T>(value: T | null | undefined, fallback: T | null = null): T | null {
  return value !== undefined && value !== null ? value : fallback
}

// Helper to get display value for UI (show "-" instead of 0)
export function displayValue(value: number | undefined | null, options?: { prefix?: string; suffix?: string; format?: 'number' | 'compact' | 'currency' }): string {
  if (value === undefined || value === null) return '-'
  
  const { prefix = '', suffix = '', format = 'number' } = options || {}
  
  let formatted: string
  switch (format) {
    case 'compact':
      if (value >= 1000000) formatted = `${(value / 1000000).toFixed(1)}M`
      else if (value >= 1000) formatted = `${(value / 1000).toFixed(1)}K`
      else formatted = value.toLocaleString()
      break
    case 'currency':
      if (value >= 1000000) formatted = `Rp ${(value / 1000000).toFixed(1)}M`
      else if (value >= 1000) formatted = `Rp ${(value / 1000).toFixed(0)}K`
      else formatted = `Rp ${value.toLocaleString()}`
      break
    default:
      formatted = value.toLocaleString()
  }
  
  return `${prefix}${formatted}${suffix}`
}

// Calculate total followers from all platforms
export function calculateTotalFollowers(data: DashboardData): number {
  let total = 0
  if (data.facebook.followers) total += data.facebook.followers
  if (data.instagram.followers) total += data.instagram.followers
  if (data.youtube.subscribers) total += data.youtube.subscribers
  return total || 0
}

// Calculate total engagement
export function calculateTotalEngagement(data: DashboardData): number {
  let total = 0
  const fb = data.facebook.engagement
  const ig = data.instagram.engagement
  const yt = data.youtube.engagement
  
  if (fb) {
    if (fb.likes) total += fb.likes
    if (fb.comments) total += fb.comments
    if (fb.shares) total += fb.shares
  }
  if (ig) {
    if (ig.likes) total += ig.likes
    if (ig.comments) total += ig.comments
  }
  if (yt) {
    if (yt.likes) total += yt.likes
    if (yt.comments) total += yt.comments
  }
  
  return total
}

// Calculate engagement rate
export function calculateEngagementRate(data: DashboardData, platform?: 'facebook' | 'instagram' | 'youtube'): string {
  if (platform) {
    const p = data[platform]
    const followers = p.followers || p.subscribers
    const engagement = p.engagement
    
    if (!followers || !engagement) return '-'
    
    let likes = engagement.likes || 0
    let comments = engagement.comments || 0
    
    const rate = (likes + comments) / followers * 100
    return rate > 0 ? `${rate.toFixed(1)}%` : '-'
  } else {
    // All platforms
    const totalFollowers = calculateTotalFollowers(data)
    const totalEngagement = calculateTotalEngagement(data)
    
    if (totalFollowers === 0 || totalEngagement === 0) return '-'
    
    const rate = (totalEngagement / totalFollowers) * 100
    return rate > 0 ? `${rate.toFixed(1)}%` : '-'
  }
}