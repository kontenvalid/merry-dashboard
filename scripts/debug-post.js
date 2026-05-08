/**
 * Debug engagement counts
 */

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'
const API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'
const FB_PAGE_ID = '1080250281836384'
const IG_USER_ID = '27556603287273697'

async function callMcp(apiKey, method, params) {
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

  const text = await response.text()
  if (text.startsWith('event:')) {
    const jsonPart = text.split('\n').find(line => line.startsWith('data:'))
    if (jsonPart) return JSON.parse(jsonPart.substring(5))
  }
  return JSON.parse(text)
}

async function executeTool(apiKey, toolSlug, args) {
  const result = await callMcp(apiKey, 'tools/call', {
    name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
    arguments: {
      current_step: 'DEBUG',
      thought: `Fetching ${toolSlug}`,
      tools: [{ tool_slug: toolSlug, arguments: args }],
      sync_response_to_workbench: false
    }
  })

  const text = result?.result?.content?.[0]?.text
  if (!text) return null

  try {
    const parsed = JSON.parse(text)
    const results = parsed?.data?.results
    if (results && results.length > 0) {
      const responseData = results[0].response?.data
      if (responseData?.data && Array.isArray(responseData.data)) return responseData
      return results[0].response
    }
    return parsed
  } catch (e) {
    return text
  }
}

async function debug() {
  console.log('=== DEBUG FACEBOOK ===')
  const fb = await executeTool(API_KEY, 'FACEBOOK_GET_PAGE_POSTS', { page_id: FB_PAGE_ID, limit: 2 })
  const posts = fb?.data
  if (posts && posts.length > 0) {
    console.log('First post keys:', Object.keys(posts[0]))
    console.log('First post:', JSON.stringify(posts[0], null, 2).substring(0, 1500))
  }
  
  console.log('\n=== DEBUG INSTAGRAM ===')
  const ig = await executeTool(API_KEY, 'INSTAGRAM_GET_IG_USER_MEDIA', { ig_user_id: IG_USER_ID, limit: 2 })
  const media = ig?.data
  if (media && media.length > 0) {
    console.log('First media keys:', Object.keys(media[0]))
    console.log('First media:', JSON.stringify(media[0], null, 2).substring(0, 1500))
  }
}

debug().catch(console.error)