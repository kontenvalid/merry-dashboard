import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiKey } from '@/lib/api-key-store'

// Platform IDs
const FB_PAGE_ID = '1080250281836384'
const IG_USER_ID = '27556603287273697'
const YT_CHANNEL_ID = 'UCK2C25kK4E3PR6w0gPNCjaA'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id || session.user.email

  try {
    // Get API key from database
    const apiKey = await getApiKey(userId, 'composio')

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        source: 'not_configured',
        message: 'Composio API key not configured',
        data: null,
        connected: {
          facebook: false,
          instagram: false,
          youtube: false,
          metaAds: false
        }
      })
    }

    // Call Composio API
    const data = await fetchFromComposio(apiKey)

    return NextResponse.json({
      success: true,
      source: 'composio_api',
      timestamp: new Date().toISOString(),
      data
    })
  } catch (error: any) {
    console.error('Overview API error:', error)
    return NextResponse.json({
      success: false,
      source: 'error',
      error: error.message,
      connected: {
        facebook: false,
        instagram: false,
        youtube: false,
        metaAds: false
      }
    }, { status: 500 })
  }
}

async function fetchFromComposio(apiKey: string) {
  const results = {
    facebook: { connected: false },
    instagram: { connected: false },
    youtube: { connected: false },
    metaAds: { connected: false }
  }

  // Call multiple tools in parallel
  const [fbData, igData, ytData] = await Promise.allSettled([
    fetchFacebookData(apiKey),
    fetchInstagramData(apiKey),
    fetchYoutubeData(apiKey)
  ])

  if (fbData.status === 'fulfilled') {
    results.facebook = fbData.value
  }
  if (igData.status === 'fulfilled') {
    results.instagram = igData.value
  }
  if (ytData.status === 'fulfilled') {
    results.youtube = ytData.value
  }

  return results
}

async function fetchFacebookData(apiKey: string) {
  try {
    // Get page details and insights
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

    // Extract data
    const pageData = details.data?.data || {}
    const metrics = insights.data?.data?.[0]?.values?.[0]?.value || {}

    return {
      connected: true,
      pageId: FB_PAGE_ID,
      pageName: pageData.name || 'Facebook Page',
      followers: metrics.page_follows || pageData.followers_count || 0,
      fanCount: pageData.followers_count || 0,
      postsCount: 0,
      engagement: {
        likes: metrics.page_post_engagements || 0,
        comments: 0,
        shares: 0
      },
      posts: {
        reach: metrics.page_reach || 0,
        impressions: metrics.page_impressions || 0
      },
      link: `https://www.facebook.com/${pageData.username || pageData.id}`
    }
  } catch (error: any) {
    console.error('Facebook fetch error:', error)
    return { connected: false, error: error?.message || 'Unknown error' }
  }
}

async function fetchInstagramData(apiKey: string) {
  try {
    // Get user profile
    const profileRes = await fetch(`https://backend.composio.dev/api/v3.1/tools/execute/INSTAGRAM_GET_USER_PROFILE`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'me', arguments: { user_id: IG_USER_ID } })
    })

    // Get user insights
    const insightsRes = await fetch(`https://backend.composio.dev/api/v3.1/tools/execute/INSTAGRAM_GET_USER_INSIGHTS`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: 'me', 
        arguments: { 
          user_id: IG_USER_ID,
          metrics: 'reach,accounts_engaged,likes,comments,saves,shares'
        }
      })
    })

    const profile = await profileRes.json()
    const insights = await insightsRes.json()

    const profileData = profile.data?.data || {}
    const metrics = insights.data?.data?.[0]?.values?.[0]?.value || {}

    return {
      connected: true,
      username: profileData.username || 'instagram',
      fullName: profileData.name || '',
      followers: profileData.followers_count || metrics.followers_count || 0,
      followers_count: profileData.followers_count || 0,
      mediaCount: profileData.media_count || 0,
      engagement: {
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        saves: metrics.saves || 0
      },
      posts: {
        reach: metrics.reach || 0,
        impressions: 0
      },
      link: `https://instagram.com/${profileData.username || ''}`
    }
  } catch (error: any) {
    console.error('Instagram fetch error:', error)
    return { connected: false, error: error?.message || 'Unknown error' }
  }
}

async function fetchYoutubeData(apiKey: string) {
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
    const channel = data.data?.data || {}

    return {
      connected: true,
      channelId: YT_CHANNEL_ID,
      channelName: channel.snippet?.title || 'YouTube Channel',
      handle: channel.snippet?.customUrl ? `@${channel.snippet.customUrl.replace('@', '')}` : '',
      subscribers: parseInt(channel.statistics?.subscriberCount || '0'),
      videoCount: parseInt(channel.statistics?.videoCount || '0'),
      viewCount: parseInt(channel.statistics?.viewCount || '0'),
      engagement: {
        likes: 0,
        comments: parseInt(channel.statistics?.commentCount || '0')
      },
      stats: {
        totalViews: parseInt(channel.statistics?.viewCount || '0'),
        avgWatchTime: '0:00'
      },
      link: `https://youtube.com/@${channel.snippet?.customUrl?.replace('@', '') || ''}`
    }
  } catch (error: any) {
    console.error('YouTube fetch error:', error)
    return { connected: false, error: error?.message || 'Unknown error' }
  }
}