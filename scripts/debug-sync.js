/**
 * Debug all platform syncs
 */

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'
const API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'

const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]
const META_API_BASE = 'https://graph.facebook.com/v21.0'
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
  console.log(`  → ${toolSlug}`)
  const result = await callMcp(apiKey, 'tools/call', {
    name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
    arguments: {
      current_step: 'DEBUG',
      thought: `Fetching ${toolSlug}`,
      tools: [{ tool_slug: toolSlug, arguments: args }],
      sync_response_to_workbench: false
    }
  })

  if (result.error) {
    console.log(`  ✗ Error:`, result.error)
    return null
  }

  const text = result?.result?.content?.[0]?.text
  if (!text) {
    console.log(`  ✗ No text content in result`)
    console.log(`  Full result:`, JSON.stringify(result)?.substring(0, 500))
    return null
  }

  try {
    const parsed = JSON.parse(text)
    const results = parsed?.data?.results
    if (results && results.length > 0) {
      const responseData = results[0].response?.data
      if (responseData?.data && Array.isArray(responseData.data)) {
        return responseData
      } else if (responseData && typeof responseData === 'object') {
        return responseData
      }
      return results[0].response
    }
    console.log(`  ✗ No results in parsed`)
    console.log(`  Parsed keys:`, Object.keys(parsed))
    return parsed
  } catch (e) {
    console.log(`  ✗ JSON parse failed:`, e.message)
    return text
  }
}

async function test() {
  console.log('=== Testing All Platforms ===\n')
  
  // Test Facebook
  console.log('📘 FACEBOOK:')
  const fb = await executeTool(API_KEY, 'FACEBOOK_GET_PAGE_POSTS', { page_id: FB_PAGE_ID, limit: 5 })
  console.log(`  Result type: ${typeof fb}, isArray: ${Array.isArray(fb)}`)
  if (fb?.data) console.log(`  posts: ${fb.data.length}`)
  else console.log(`  No .data property, keys:`, fb ? Object.keys(fb) : 'null')
  console.log()
  
  // Test Instagram
  console.log('📷 INSTAGRAM:')
  const ig = await executeTool(API_KEY, 'INSTAGRAM_GET_IG_USER_MEDIA', { ig_user_id: IG_USER_ID, limit: 5 })
  console.log(`  Result type: ${typeof ig}, isArray: ${Array.isArray(ig)}`)
  if (ig?.data) console.log(`  media: ${ig.data.length}`)
  else console.log(`  No .data property, keys:`, ig ? Object.keys(ig) : 'null')
  console.log()
  
  // Test YouTube
  console.log('📺 YOUTUBE:')
  const yt = await executeTool(API_KEY, 'YOUTUBE_GET_CHANNEL_STATISTICS', { channel_id: YT_CHANNEL_ID })
  console.log(`  Result type: ${typeof yt}`)
  if (yt?.statistics) console.log(`  subscribers: ${yt.statistics.subscriberCount}`)
  else console.log(`  No .statistics property, keys:`, yt ? Object.keys(yt) : 'null')
  console.log()
  
  // Test Meta Ads
  console.log('💰 META ADS:')
  for (const account of META_ADS_ACCOUNTS) {
    try {
      const res = await fetch(`${META_API_BASE}/${account.id}/campaigns?fields=id,name,status,spend&access_token=${API_KEY}`)
      const d = await res.json()
      if (d.data) console.log(`  ${account.name}: ${d.data.length} campaigns`)
      else console.log(`  ${account.name}: failed - ${d.error?.message || JSON.stringify(d).substring(0, 100)}`)
    } catch (e) {
      console.log(`  ${account.name}: error - ${e.message}`)
    }
  }
}

test().catch(console.error)