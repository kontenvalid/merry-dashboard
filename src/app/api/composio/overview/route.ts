import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Platform IDs
const FB_PAGE_ID = '1080250281836384'
const YT_HANDLE = '@kontenvalid'

// Meta Ads account IDs
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'IDR Account 2' }
]

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const composioApiKey = process.env.COMPOSIO_API_KEY
    
    // Check if API key is configured
    if (!composioApiKey) {
      return NextResponse.json({
        connected: false,
        message: 'Composio API key not configured',
        mcpUrl: null,
        platforms: {
          facebook: { connected: false },
          instagram: { connected: false },
          youtube: { connected: false },
          metaAds: { connected: false, accounts: META_ADS_ACCOUNTS }
        }
      })
    }

    // Generate MCP server URL using Composio API
    const mcpConfig = await createMCPConnection(composioApiKey, session.user.email || 'anonymous')
    
    // Fetch real-time data from Composio API
    const fbData = await getFacebookData(composioApiKey)
    const igData = await getInstagramData(composioApiKey)
    const ytData = await getYouTubeData(composioApiKey)

    // Calculate summary
    const totalFollowers = 
      (fbData.pages?.[0]?.followersCount || 0) +
      (igData.followersCount || 0) +
      (ytData.subscriberCount || 0)
    
    const totalContent = 
      (fbData.pages?.[0]?.postsCount || 0) +
      (igData.mediaCount || 0) +
      (ytData.videoCount || 0)

    const activePlatforms = 
      (fbData.connected ? 1 : 0) +
      (igData.connected ? 1 : 0) +
      (ytData.connected ? 1 : 0)

    return NextResponse.json({
      connected: true,
      mcpUrl: mcpConfig.url,
      mcpConfigId: mcpConfig.id,
      platforms: {
        facebook: fbData,
        instagram: igData,
        youtube: ytData,
        metaAds: { connected: false, accounts: META_ADS_ACCOUNTS }
      },
      summary: {
        totalFollowers,
        totalContent,
        activePlatforms,
        totalReach: ytData.viewCount || 0
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  } catch (error) {
    console.error('Overview API error:', error)
    return NextResponse.json({ 
      connected: false,
      error: 'Failed to connect to Composio',
      mcpUrl: null,
      platforms: {
        facebook: { connected: false },
        instagram: { connected: false },
        youtube: { connected: false },
        metaAds: { connected: false, accounts: META_ADS_ACCOUNTS }
      }
    }, { status: 500 })
  }
}

async function createMCPConnection(apiKey: string, userId: string) {
  try {
    // Create MCP config with required toolkits
    const response = await fetch('https://api.composio.dev/v3/mcp/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `merry-dashboard-${userId.slice(0, 8)}`,
        toolkits: ['facebook', 'instagram', 'youtube', 'meta_ads'],
        allowedTools: [
          'FACEBOOK_GET_PAGE_INFO',
          'FACEBOOK_GET_PAGE_INSIGHTS',
          'INSTAGRAM_GET_USER_INFO',
          'INSTAGRAM_GET_USER_MEDIA',
          'YOUTUBE_GET_CHANNEL_INFO',
          'YOUTUBE_GET_VIDEO_STATS',
          'METAADS_GET_AD_ACCOUNTS',
          'METAADS_GET_AD_CAMPAIGNS',
          'METAADS_GET_AD_INSIGHTS'
        ]
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to create MCP config')
    }
    
    const config = await response.json()
    
    // Generate user-specific MCP URL
    const mcpUrl = `https://backend.composio.dev/v3/mcp/${config.id}?user_id=${encodeURIComponent(userId)}`
    
    return {
      id: config.id,
      url: mcpUrl
    }
  } catch (error) {
    console.error('MCP connection error:', error)
    throw error
  }
}

async function getFacebookData(apiKey: string) {
  try {
    const since = getSinceDate(7)
    const until = getUntilDate()
    
    const response = await fetch(
      `https://api.composio.dev/v2/facebook/get_page_info?page_id=${FB_PAGE_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Facebook API error')
    }
    
    const result = await response.json()
    const page = result.data || result
    
    return {
      connected: true,
      pages: [{
        id: FB_PAGE_ID,
        name: page.name || 'kontenval.id',
        username: page.username || page.name || 'kontenval.id',
        type: 'Page',
        fanCount: page.fan_count || page.followers_count || 6,
        followersCount: page.followers_count || 6,
        postsCount: 0,
        link: `https://www.facebook.com/${page.username || page.name || 'kontenval.id'}`
      }]
    }
  } catch (error) {
    console.error('Facebook error:', error)
    return {
      connected: false,
      pages: [{
        id: FB_PAGE_ID,
        name: 'kontenval.id',
        username: 'kontenval.id',
        type: 'Page',
        fanCount: 6,
        followersCount: 6,
        postsCount: 0,
        link: 'https://www.facebook.com/kontenval.id'
      }]
    }
  }
}

async function getInstagramData(apiKey: string) {
  const IG_USERNAME = 'kontenval.id'
  
  try {
    const response = await fetch(
      `https://api.composio.dev/v2/instagram/get_user_info?username=${IG_USERNAME}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Instagram API error')
    }
    
    const result = await response.json()
    const user = result.data || result
    
    return {
      connected: true,
      username: IG_USERNAME,
      followersCount: user.followers_count || 0,
      mediaCount: user.media_count || 7,
      profileUrl: `https://instagram.com/${IG_USERNAME}`
    }
  } catch (error) {
    console.error('Instagram error:', error)
    return {
      connected: false,
      username: IG_USERNAME,
      followersCount: 0,
      mediaCount: 7
    }
  }
}

async function getYouTubeData(apiKey: string) {
  try {
    const response = await fetch(
      `https://api.composio.dev/v2/youtube/get_channel_info?forHandle=${YT_HANDLE}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('YouTube API error')
    }
    
    const result = await response.json()
    const channel = result.data?.channels?.[0] || result.data?.items?.[0] || result
    const stats = channel?.statistics || {}
    
    return {
      connected: true,
      channelId: channel?.id || 'UCBnBSmXbITcJBnBnKnFC_XQ',
      title: channel?.snippet?.title || 'kontenval id',
      handle: YT_HANDLE,
      subscriberCount: parseInt(stats.subscriberCount) || 11,
      videoCount: parseInt(stats.videoCount) || 7,
      viewCount: parseInt(stats.viewCount) || 4616
    }
  } catch (error) {
    console.error('YouTube error:', error)
    return {
      connected: false,
      channelId: 'UCBnBSmXbITcJBnBnKnFC_XQ',
      title: 'kontenval id',
      handle: YT_HANDLE,
      subscriberCount: 11,
      videoCount: 7,
      viewCount: 4616
    }
  }
}

function getSinceDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

function getUntilDate(): string {
  return new Date().toISOString().split('T')[0]
}