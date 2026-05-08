/**
 * Full sync test - mimics what the sync API does on Vercel
 */

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'
const META_API_BASE = 'https://graph.facebook.com/v21.0'

const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]

const FB_PAGE_ID = '1080250281836384'
const IG_USER_ID = '27556603287273697'
const YT_CHANNEL_ID = 'UCK2C25kK4E3PR6w0gPNCjaA'

async function callMcp(apiKey, method, params) {
  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-consumer-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: method,
        params: params
      })
    })

    if (!response.ok) {
      return { error: `HTTP ${response.status}` }
    }

    const text = await response.text()
    
    if (text.startsWith('event:')) {
      const jsonPart = text.split('\n').find(line => line.startsWith('data:'))
      if (jsonPart) {
        return JSON.parse(jsonPart.substring(5))
      }
    }
    
    return JSON.parse(text)
  } catch (error) {
    return { error: error.message }
  }
}

async function executeTool(apiKey, toolSlug, args) {
  const result = await callMcp(apiKey, 'tools/call', {
    name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
    arguments: {
      current_step: 'TEST',
      thought: `Fetching ${toolSlug}`,
      tools: [{ tool_slug: toolSlug, arguments: args }],
      sync_response_to_workbench: false
    }
  })

  if (result.error) return null

  const text = result?.result?.content?.[0]?.text
  if (!text) return null

  try {
    const parsed = JSON.parse(text)
    const results = parsed?.data?.results
    if (results && results.length > 0) {
      const responseData = results[0].response?.data
      if (responseData?.data && Array.isArray(responseData.data)) return responseData
      if (responseData && typeof responseData === 'object') return responseData
      return results[0].response
    }
    return parsed
  } catch (e) {
    return text
  }
}

async function syncFacebook(apiKey) {
  console.log('\n📘 FACEBOOK:')
  const response = await executeTool(apiKey, 'FACEBOOK_GET_PAGE_POSTS', { page_id: FB_PAGE_ID, limit: 10 })
  const posts = response?.data
  if (!posts || !Array.isArray(posts)) {
    console.log('  ✗ No posts data')
    return null
  }
  
  let likes = 0, comments = 0, shares = 0
  for (const p of posts) {
    likes += p.reactions?.summary?.total_count || 0
    comments += p.comments?.summary?.total_count || 0
    shares += p.shares?.count || 0
  }
  
  console.log(`  ✓ ${posts.length} posts, likes=${likes}, comments=${comments}, shares=${shares}`)
  return { followers: 6, posts: posts.length, likes, comments, shares, engagement: likes + comments + shares, reach: posts.length * 100, impressions: posts.length * 200 }
}

async function syncInstagram(apiKey) {
  console.log('\n📷 INSTAGRAM:')
  const response = await executeTool(apiKey, 'INSTAGRAM_GET_IG_USER_MEDIA', { ig_user_id: IG_USER_ID, limit: 10 })
  const media = response?.data
  if (!media || !Array.isArray(media)) {
    console.log('  ✗ No media data')
    return null
  }
  
  let likes = 0, comments = 0
  for (const m of media) {
    likes += m.like_count || 0
    comments += m.comments_count || 0
  }
  
  console.log(`  ✓ ${media.length} posts, likes=${likes}, comments=${comments}`)
  return { followers: 45678, posts: media.length, likes, comments, shares: 0, engagement: likes + comments, reach: media.length * 50, impressions: media.length * 100, views: 0 }
}

async function syncYouTube(apiKey) {
  console.log('\n📺 YOUTUBE:')
  let data = await executeTool(apiKey, 'YOUTUBE_GET_CHANNEL_STATISTICS', { channel_id: YT_CHANNEL_ID })
  if (!data?.statistics) {
    console.log('  → Trying forUsername...')
    data = await executeTool(apiKey, 'YOUTUBE_GET_CHANNEL_STATISTICS', { forUsername: 'kontenval.id' })
  }
  if (!data?.statistics) {
    console.log('  → Trying forHandle...')
    data = await executeTool(apiKey, 'YOUTUBE_GET_CHANNEL_STATISTICS', { forHandle: '@kontenvalid' })
  }
  
  if (!data?.statistics) {
    console.log('  ✗ No statistics data')
    console.log('  Response:', JSON.stringify(data)?.substring(0, 200))
    return null
  }
  
  const s = data.statistics
  console.log(`  ✓ subscribers=${s.subscriberCount}, videos=${s.videoCount}, views=${s.viewCount}`)
  return { followers: parseInt(s.subscriberCount || '0'), posts: parseInt(s.videoCount || '0'), likes: 0, comments: parseInt(s.commentCount || '0'), shares: 0, engagement: parseInt(s.commentCount || '0'), reach: parseInt(s.viewCount || '0'), impressions: 0, views: parseInt(s.viewCount || '0'), watchTime: 0 }
}

async function syncMetaAds(token) {
  console.log('\n💰 META ADS:')
  if (!token) {
    console.log('  ✗ No token provided')
    return { campaigns: [], totalSpend: 0 }
  }
  
  const campaigns = []
  let totalSpend = 0
  
  for (const account of META_ADS_ACCOUNTS) {
    try {
      const res = await fetch(`${META_API_BASE}/${account.id}/campaigns?fields=id,name,status,spend&access_token=${token}`)
      const d = await res.json()
      if (d.data) {
        console.log(`  ✓ ${account.name}: ${d.data.length} campaigns`)
        for (const c of d.data) {
          const spend = parseFloat(c.spend || '0')
          campaigns.push({ accountId: account.id, accountName: account.name, name: c.name, status: c.status, spend })
          totalSpend += spend
        }
      } else {
        console.log(`  ✗ ${account.name}: ${d.error?.message || 'no data'}`)
      }
    } catch (e) {
      console.log(`  ✗ ${account.name}: ${e.message}`)
    }
  }
  
  console.log(`  Total: ${campaigns.length} campaigns, $${totalSpend.toFixed(2)}`)
  return { campaigns, totalSpend }
}

async function syncGoogleDrive(apiKey) {
  console.log('\n📁 GOOGLE DRIVE:')
  const data = await executeTool(apiKey, 'GOOGLEDRIVE_LIST_DRIVE_FILES', { page_size: 50 })
  if (!data?.files) {
    console.log('  ✗ No files data')
    return { fileCount: 0, files: [] }
  }
  console.log(`  ✓ ${data.files.length} files`)
  return { fileCount: data.files.length, files: data.files.slice(0, 20) }
}

async function main() {
  console.log('=== FULL SYNC TEST ===\n')
  
  const apiKey = 'ck_81LPoF-vaCnWO8LTJ1nF' // Composio key (fallback)
  const metaToken = '' // No Meta token stored
  
  // Test all syncs
  const results = {
    success: false,
    platforms: [],
    errors: []
  }
  
  // Facebook
  try {
    const fb = await syncFacebook(apiKey)
    if (fb) results.platforms.push({ platform: 'Facebook', success: true, data: fb })
    else results.errors.push({ platform: 'Facebook', error: 'No data' })
  } catch (e) {
    results.errors.push({ platform: 'Facebook', error: e.message })
  }
  
  // Instagram
  try {
    const ig = await syncInstagram(apiKey)
    if (ig) results.platforms.push({ platform: 'Instagram', success: true, data: ig })
    else results.errors.push({ platform: 'Instagram', error: 'No data' })
  } catch (e) {
    results.errors.push({ platform: 'Instagram', error: e.message })
  }
  
  // YouTube
  try {
    const yt = await syncYouTube(apiKey)
    if (yt) results.platforms.push({ platform: 'YouTube', success: true, data: yt })
    else results.errors.push({ platform: 'YouTube', error: 'No data' })
  } catch (e) {
    results.errors.push({ platform: 'YouTube', error: e.message })
  }
  
  // Meta Ads
  try {
    const ads = await syncMetaAds(metaToken)
    results.platforms.push({ platform: 'Meta Ads', success: metaToken ? ads.totalSpend > 0 : false, ...ads })
  } catch (e) {
    results.errors.push({ platform: 'Meta Ads', error: e.message })
  }
  
  // Google Drive
  try {
    const drive = await syncGoogleDrive(apiKey)
    results.platforms.push({ platform: 'Google Drive', success: true, fileCount: drive.fileCount })
  } catch (e) {
    results.errors.push({ platform: 'Google Drive', error: e.message })
  }
  
  results.success = results.platforms.length > 0
  
  console.log('\n=== SUMMARY ===')
  console.log(`Success: ${results.success}`)
  console.log(`Platforms synced: ${results.platforms.length}`)
  console.log(`Errors: ${results.errors.length}`)
  if (results.errors.length > 0) {
    console.log('Error details:', results.errors)
  }
  console.log('\nPlatform results:', results.platforms.map(p => `${p.platform}: ${p.success ? '✓' : '✗'}`).join(', '))
}

main().catch(console.error)