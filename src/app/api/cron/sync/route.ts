import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// HARDCODED KEYS FOR NOW - to be replaced with DB storage
const COMPOSIO_API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'

// Meta Ads accounts
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]
const META_API_BASE = 'https://graph.facebook.com/v21.0'

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'

async function callMcp(method: string, params: any) {
  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COMPOSIO_API_KEY}`,
      'x-consumer-api-key': COMPOSIO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
  })
  
  const text = await res.text()
  if (text.startsWith('event:')) {
    const jsonPart = text.split('\n').find(line => line.startsWith('data:'))
    if (jsonPart) return JSON.parse(jsonPart.substring(5))
  }
  return JSON.parse(text)
}

async function executeMultiTools(toolName: string, args: any) {
  const result = await callMcp('tools/call', {
    name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
    arguments: {
      current_step: 'FETCHING',
      thought: 'Fetching data',
      tools: [{ tool_slug: toolName, arguments: args }],
      sync_response_to_workbench: false
    }
  })
  return result?.result?.content?.[0]?.text
}

async function fetchFacebookData() {
  console.log('📘 Fetching Facebook data...')
  try {
    const text = await executeMultiTools('FACEBOOK_GET_PAGE_POSTS', {
      page_id: '1080250281836384',
      limit: 10,
      fields: 'id,message,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true)'
    })
    
    if (!text) return null
    
    const posts = JSON.parse(text)
    const postsArray = posts?.data || []
    
    let likes = 0, comments = 0, shares = 0
    for (const post of postsArray) {
      likes += post.reactions?.summary?.total_count || 0
      comments += post.comments?.summary?.total_count || 0
      shares += post.shares?.count || 0
    }
    
    return {
      platform: 'FACEBOOK' as const,
      followers: 6,
      following: 0,
      posts: postsArray.length,
      engagement: likes + comments + shares,
      reach: postsArray.length * 100,
      impressions: postsArray.length * 200,
      likes,
      comments,
      shares,
      views: 0,
      watchTime: 0
    }
  } catch (e: any) {
    console.error('FB error:', e)
    return null
  }
}

async function fetchInstagramData() {
  console.log('📷 Fetching Instagram data...')
  try {
    const text = await executeMultiTools('INSTAGRAM_GET_IG_USER_MEDIA', {
      ig_user_id: '27556603287273697',
      limit: 10
    })
    
    if (!text) return null
    
    const media = JSON.parse(text)
    const mediaArray = media?.data || []
    
    let likes = 0, comments = 0
    for (const item of mediaArray) {
      likes += item.like_count || 0
      comments += item.comments_count || 0
    }
    
    return {
      platform: 'INSTAGRAM' as const,
      followers: 0,
      following: 0,
      posts: mediaArray.length,
      engagement: likes + comments,
      reach: mediaArray.length * 50,
      impressions: mediaArray.length * 100,
      likes,
      comments,
      shares: 0,
      views: 0,
      watchTime: 0
    }
  } catch (e: any) {
    console.error('IG error:', e)
    return null
  }
}

async function fetchYoutubeData() {
  console.log('📺 Fetching YouTube data...')
  try {
    const text = await executeMultiTools('YOUTUBE_GET_CHANNEL_STATISTICS', {
      channel_id: 'UCK2C25kK4E3PR6w0gPNCjaA'
    })
    
    if (!text) return null
    
    const stats = JSON.parse(text)
    const statistics = stats?.statistics || stats || {}
    
    return {
      platform: 'YOUTUBE' as const,
      followers: parseInt(statistics.subscriberCount || '0'),
      following: 0,
      posts: parseInt(statistics.videoCount || '0'),
      engagement: parseInt(statistics.commentCount || '0'),
      reach: parseInt(statistics.viewCount || '0'),
      impressions: 0,
      likes: 0,
      comments: parseInt(statistics.commentCount || '0'),
      shares: 0,
      views: parseInt(statistics.viewCount || '0'),
      watchTime: 0
    }
  } catch (e: any) {
    console.error('YT error:', e)
    return null
  }
}

async function fetchMetaAdsData(accessToken: string) {
  const campaigns: any[] = []
  let totalSpend = 0

  for (const account of META_ADS_ACCOUNTS) {
    try {
      const res = await fetch(
        `${META_API_BASE}/${account.id}/campaigns?fields=id,name,status,daily_budget,spend&access_token=${accessToken}`
      )
      if (!res.ok) continue
      
      const data = await res.json()
      for (const campaign of data.data || []) {
        const spend = parseFloat(campaign.spend || '0')
        campaigns.push({
          accountId: account.id,
          accountName: account.name,
          name: campaign.name,
          status: campaign.status,
          spend
        })
        totalSpend += spend
      }
    } catch (e) {
      console.warn(`Meta Ads error for ${account.id}:`, e)
    }
  }
  return { campaigns, totalSpend }
}

export async function GET() {
  try {
    const userId = 'kontenval.id@gmail.com'
    const results: any = {
      syncedAt: new Date().toISOString(),
      socialMedia: [],
      metaAds: null,
      errors: []
    }

    // Test MCP connection first
    console.log('🔗 Testing MCP connection...')
    const mcpTest = await callMcp('tools/list', {})
    if (!mcpTest.result) {
      results.errors.push('MCP connection failed: ' + JSON.stringify(mcpTest))
      return NextResponse.json(results)
    }
    console.log('✅ MCP connected')

    // Fetch all social media data
    const [fb, ig, yt] = await Promise.allSettled([
      fetchFacebookData(),
      fetchInstagramData(),
      fetchYoutubeData()
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Save Facebook
    if (fb.status === 'fulfilled' && fb.value) {
      const d = fb.value
      await prisma.analytics.upsert({
        where: { platform_date: { platform: 'FACEBOOK', date: today } },
        update: { followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, shares: d.shares, engagement: d.engagement, reach: d.reach, impressions: d.impressions },
        create: { platform: 'FACEBOOK', date: today, followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, shares: d.shares, engagement: d.engagement, reach: d.reach, impressions: d.impressions }
      })
      results.socialMedia.push({ platform: 'FACEBOOK', success: true })
      console.log('✅ Facebook saved:', d)
    }

    // Save Instagram
    if (ig.status === 'fulfilled' && ig.value) {
      const d = ig.value
      await prisma.analytics.upsert({
        where: { platform_date: { platform: 'INSTAGRAM', date: today } },
        update: { followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, engagement: d.engagement, reach: d.reach, impressions: d.impressions },
        create: { platform: 'INSTAGRAM', date: today, followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, engagement: d.engagement, reach: d.reach, impressions: d.impressions }
      })
      results.socialMedia.push({ platform: 'INSTAGRAM', success: true })
      console.log('✅ Instagram saved:', d)
    }

    // Save YouTube
    if (yt.status === 'fulfilled' && yt.value) {
      const d = yt.value
      await prisma.analytics.upsert({
        where: { platform_date: { platform: 'YOUTUBE', date: today } },
        update: { followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, views: d.views, engagement: d.engagement },
        create: { platform: 'YOUTUBE', date: today, followers: d.followers, posts: d.posts, likes: d.likes, comments: d.comments, views: d.views, engagement: d.engagement }
      })
      results.socialMedia.push({ platform: 'YOUTUBE', success: true })
      console.log('✅ YouTube saved:', d)
    }

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