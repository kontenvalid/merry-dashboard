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

async function fetchFacebookData() {
  const data = await executeTool('FACEBOOK_GET_PAGE_POSTS', { page_id: '1080250281836384', limit: 10 })
  if (!data?.data) return null
  const posts = data.data
  let likes = 0, comments = 0, shares = 0
  for (const p of posts) { likes += p.reactions?.summary?.total_count || 0; comments += p.comments?.summary?.total_count || 0; shares += p.shares?.count || 0 }
  return { platform: 'FACEBOOK', followers: 6, posts: posts.length, likes, comments, shares, engagement: likes + comments + shares, reach: posts.length * 100 }
}

async function fetchInstagramData() {
  const data = await executeTool('INSTAGRAM_GET_IG_USER_MEDIA', { ig_user_id: '27556603287273697', limit: 10 })
  if (!data?.data) return null
  const media = data.data
  let likes = 0, comments = 0
  for (const m of media) { likes += m.like_count || 0; comments += m.comments_count || 0 }
  return { platform: 'INSTAGRAM', followers: 0, posts: media.length, likes, comments, engagement: likes + comments, reach: media.length * 50 }
}

async function fetchYoutubeData() {
  const data = await executeTool('YOUTUBE_GET_CHANNEL_STATISTICS', { channel_id: 'UCK2C25kK4E3PR6w0gPNCjaA' })
  if (!data) return null
  const s = data.statistics || data
  return { platform: 'YOUTUBE', followers: parseInt(s.subscriberCount || '0'), posts: parseInt(s.videoCount || '0'), likes: 0, comments: parseInt(s.commentCount || '0'), views: parseInt(s.viewCount || '0'), engagement: parseInt(s.commentCount || '0') }
}

async function fetchGoogleDriveData() {
  const data = await executeTool('GOOGLEDRIVE_LIST_FILES', { max_results: 100 })
  if (!data?.files) return null
  return { fileCount: data.files.length, files: data.files.slice(0, 10) }
}

export async function GET() {
  const results: any = { syncedAt: new Date().toISOString(), socialMedia: [], googleDrive: null, errors: [] }
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const [fb, ig, yt, gdrive] = await Promise.allSettled([
    fetchFacebookData(), fetchInstagramData(), fetchYoutubeData(), fetchGoogleDriveData()
  ])

  const save = async (platform: 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE', data: any) => {
    if (!data) return
    const update: any = { followers: data.followers || 0, posts: data.posts || 0, likes: data.likes || 0, comments: data.comments || 0, engagement: data.engagement || 0 }
    if (data.shares) update.shares = data.shares
    if (data.reach) update.reach = data.reach
    if (data.views) update.views = data.views
    await prisma.analytics.upsert({
      where: { platform_date: { platform, date: today } },
      update,
      create: { platform, date: today, followers: data.followers || 0, posts: data.posts || 0, likes: data.likes || 0, comments: data.comments || 0, engagement: data.engagement || 0, reach: data.reach || 0 }
    })
    results.socialMedia.push({ platform, success: true, data })
  }

  if (fb.status === 'fulfilled') await save('FACEBOOK', fb.value)
  else results.errors.push({ platform: 'FACEBOOK', error: fb.reason?.message || 'Failed' })
  
  if (ig.status === 'fulfilled') await save('INSTAGRAM', ig.value)
  else results.errors.push({ platform: 'INSTAGRAM', error: ig.reason?.message || 'Failed' })
  
  if (yt.status === 'fulfilled') await save('YOUTUBE', yt.value)
  else results.errors.push({ platform: 'YOUTUBE', error: yt.reason?.message || 'Failed' })
  
  if (gdrive.status === 'fulfilled' && gdrive.value) results.googleDrive = gdrive.value

  return NextResponse.json({ success: results.errors.length === 0, ...results })
}
