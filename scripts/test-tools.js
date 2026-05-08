/**
 * Debug tool options for Facebook/Instagram engagement
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
      return results[0].response?.data || results[0].response
    }
    return parsed
  } catch (e) {
    return text
  }
}

async function test() {
  console.log('=== Test Facebook tools ===')
  
  // Try different tools
  const tools = [
    'FACEBOOK_GET_PAGE_INFO',
    'FACEBOOK_GET_PAGE_INSIGHTS',
  ]
  
  for (const tool of tools) {
    console.log(`\n🔧 ${tool}:`)
    let args = { page_id: FB_PAGE_ID }
    if (tool === 'FACEBOOK_GET_PAGE_INSIGHTS') {
      args = { page_id: FB_PAGE_ID, metrics: 'page_fans,page_impressions,page_engaged_users' }
    }
    const result = await executeTool(API_KEY, tool, args)
    console.log(JSON.stringify(result, null, 2)?.substring(0, 1000))
  }
  
  console.log('\n\n=== Test Instagram tools ===')
  
  const igTools = [
    'INSTAGRAM_GET_IG_USER_INFO',
    'INSTAGRAM_GET_IG_USER_INSIGHTS',
  ]
  
  for (const tool of igTools) {
    console.log(`\n🔧 ${tool}:`)
    const result = await executeTool(API_KEY, tool, { ig_user_id: IG_USER_ID })
    console.log(JSON.stringify(result, null, 2)?.substring(0, 1500))
  }
}

test().catch(console.error)