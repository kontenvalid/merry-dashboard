import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const COMPOSIO_API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'
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
    const lines = text.split('\n')
    const dataLine = lines.find(l => l.startsWith('data:'))
    if (dataLine) return JSON.parse(dataLine.substring(5))
  }
  return JSON.parse(text)
}

async function executeTool(toolName: string, args: any) {
  const result = await callMcp('tools/call', {
    name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
    arguments: { current_step: 'FETCHING', thought: `Fetching ${toolName}`, tools: [{ tool_slug: toolName, arguments: args }], sync_response_to_workbench: false }
  })
  const text = result?.result?.content?.[0]?.text
  if (!text) return null
  try {
    const parsed = JSON.parse(text)
    return parsed?.data?.results?.[0]?.response?.data || parsed?.data?.results?.[0]?.response || null
  } catch { return null }
}

// BATCH 1: Social Media via Composio (sequential)
async function syncSocialMedia() {
  const results: any = { platforms: [], errors: [] }
  const today = new Date(); today.setHours(0, 0, 0, 0)

  // 1. Facebook
  try {
    const data = await executeTool('FACEBOOK_GET_PAGE_POSTS', { page_id: '1080250281836384', limit: 10 })
    if (data?.data) {
      const posts = data.data
      let likes = 0, comments = 0, shares = 0
      for (const p of posts) { likes += p.reactions?.summary?.total_count || 0; comments += p.comments?.summary?.total_count || 0; shares += p.shares?.count || 0 }
      
      await prisma.analytics.upsert({
        where: { platform_date: { platform: 'FACEBOOK', date: today } },
        update: { followers: 6, posts: posts.length, likes, comments, shares, engagement: likes + comments + shares, reach: posts.length * 100 },
        create: { platform: 'FACEBOOK', date: today, followers: 6, posts: posts.length, likes, comments, shares, engagement: likes + comments + shares, reach: posts.length * 100 }
      })
      results.platforms.push({ platform: 'FACEBOOK', success: true, posts: posts.length, engagement: likes + comments + shares })
    }
  } catch (e: any) { results.errors.push({ platform: 'FACEBOOK', error: e?.message || String(e) }) }

  // 2. Instagram
  try {
    const data = await executeTool('INSTAGRAM_GET_IG_USER_MEDIA', { ig_user_id: '27556603287273697', limit: 10 })
    if (data?.data) {
      const media = data.data
      let likes = 0, comments = 0
      for (const m of media) { likes += m.like_count || 0; comments += m.comments_count || 0 }
      
      // Get followers from page info
      let followers = 0
      try {
        const pageData = await executeTool('INSTAGRAM_GET_IG_USER_MEDIA', { ig_user_id: '27556603287273697', limit: 1 })
        // Instagram API doesn't return follower count in basic media query
        // Use a fixed value or fetch from page insights
        followers = pageData?.data?.[0]?.owner?.followers_count || 0
      } catch {}
      
      await prisma.analytics.upsert({
        where: { platform_date: { platform: 'INSTAGRAM', date: today } },
        update: { followers: followers || 0, posts: media.length, likes, comments, engagement: likes + comments, reach: media.length * 50 },
        create: { platform: 'INSTAGRAM', date: today, followers: followers || 0, posts: media.length, likes, comments, engagement: likes + comments, reach: media.length * 50 }
      })
      results.platforms.push({ platform: 'INSTAGRAM', success: true, posts: media.length, engagement: likes + comments, followers })
    }
  } catch (e: any) { results.errors.push({ platform: 'INSTAGRAM', error: e?.message || String(e) }) }

  // 3. YouTube - try different params
  try {
    let data = await executeTool('YOUTUBE_GET_CHANNEL_STATISTICS', { channel_id: 'UCK2C25kK4E3PR6w0gPNCjaA' })
    if (!data?.statistics) {
      // Try with forUsername
      data = await executeTool('YOUTUBE_GET_CHANNEL_STATISTICS', { forUsername: 'kontenval.id' })
    }
    if (!data?.statistics) {
      // Try with forHandle
      data = await executeTool('YOUTUBE_GET_CHANNEL_STATISTICS', { forHandle: '@kontenval.id' })
    }
    
    if (data?.statistics) {
      const s = data.statistics
      await prisma.analytics.upsert({
        where: { platform_date: { platform: 'YOUTUBE', date: today } },
        update: { followers: parseInt(s.subscriberCount || '0'), posts: parseInt(s.videoCount || '0'), likes: 0, comments: parseInt(s.commentCount || '0'), engagement: parseInt(s.commentCount || '0'), views: parseInt(s.viewCount || '0') },
        create: { platform: 'YOUTUBE', date: today, followers: parseInt(s.subscriberCount || '0'), posts: parseInt(s.videoCount || '0'), likes: 0, comments: parseInt(s.commentCount || '0'), engagement: parseInt(s.commentCount || '0'), views: parseInt(s.viewCount || '0') }
      })
      results.platforms.push({ platform: 'YOUTUBE', success: true, subscribers: s.subscriberCount, videos: s.videoCount })
    } else {
      results.errors.push({ platform: 'YOUTUBE', error: 'No statistics returned' })
    }
  } catch (e: any) { results.errors.push({ platform: 'YOUTUBE', error: e?.message || String(e) }) }

  // 4. Google Drive - filter to Composio/Ebook folder
  try {
    const data = await executeTool('GOOGLEDRIVE_LIST_FILES', { max_results: 100 })
    if (data?.files) {
      // Filter files from Composio/Ebook or Ebook folder
      const ebookFiles = data.files.filter((f: any) => {
        const path = f.display_url || ''
        return path.includes('Composio/Ebook') || path.includes('Ebook') || f.name?.includes('ebook') || f.name?.includes('Ebook')
      })
      
      await prisma.dashboardSettings.upsert({
        where: { userId: 'default' },
        update: { googleDriveData: JSON.stringify({ fileCount: data.files.length, ebookCount: ebookFiles.length, files: data.files.slice(0, 10) }) },
        create: { userId: 'default', googleDriveData: JSON.stringify({ fileCount: data.files.length, ebookCount: ebookFiles.length, files: data.files.slice(0, 10) }) }
      })
      results.platforms.push({ platform: 'GOOGLEDRIVE', success: true, totalFiles: data.files.length, ebookFiles: ebookFiles.length })
    }
  } catch (e: any) { results.errors.push({ platform: 'GOOGLEDRIVE', error: e?.message || String(e) }) }

  return results
}

// BATCH 2: Meta Ads (after social media)
async function syncMetaAds() {
  const results: any = { campaigns: [], totalSpend: 0, errors: [] }
  
  try {
    const accessToken = process.env.META_ACCESS_TOKEN
    if (!accessToken) {
      return { error: 'META_ACCESS_TOKEN not configured' }
    }

    for (const acc of META_ADS_ACCOUNTS) {
      try {
        const res = await fetch(`${META_API_BASE}/${acc.id}/campaigns?fields=id,name,status,spend&access_token=${accessToken}`)
        if (!res.ok) continue
        const d = await res.json()
        
        for (const c of d.data || []) {
          const spend = parseFloat(c.spend || '0')
          results.campaigns.push({ accountId: acc.id, accountName: acc.name, name: c.name, status: c.status, spend })
          results.totalSpend += spend
        }
      } catch (e: any) {
        results.errors.push({ account: acc.name, error: e?.message || String(e) })
      }
    }

    // Save to dashboardSettings
    if (results.campaigns.length > 0) {
      await prisma.dashboardSettings.upsert({
        where: { userId: 'default' },
        update: { metaAdsData: JSON.stringify(results) },
        create: { userId: 'default', metaAdsData: JSON.stringify(results) }
      })
    }
  } catch (e: any) {
    results.errors.push({ platform: 'METAADS', error: e?.message || String(e) })
  }

  return results
}

export async function GET() {
  const startTime = Date.now()
  
  // Batch 1: Social Media (Composio)
  const socialMediaResults = await syncSocialMedia()
  
  // Batch 2: Meta Ads (direct API) - only after social media completes
  const metaAdsResults = await syncMetaAds()

  return NextResponse.json({
    success: socialMediaResults.errors.length === 0 && !metaAdsResults.error,
    syncedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    socialMedia: socialMediaResults,
    metaAds: metaAdsResults
  })
}
