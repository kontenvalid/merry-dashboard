// Test different execution methods
const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'
const API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'

// Platform IDs
const FB_PAGE_ID = '1080250281836384'
const IG_USER_ID = '27556603287273697'
const YT_CHANNEL_ID = 'UCK2C25kK4E3PR6w0gPNCjaA'

async function callMcp(method, params = {}) {
  const res = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'x-consumer-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
  })
  
  const text = await res.text()
  
  if (text.startsWith('event:')) {
    const jsonPart = text.split('\n').find(line => line.startsWith('data:'))
    if (jsonPart) {
      return JSON.parse(jsonPart.substring(5))
    }
  }
  
  return JSON.parse(text)
}

async function main() {
  console.log('=== Testing Multi-Execute ===\n')

  // Try COMPOSIO_MULTI_EXECUTE_TOOL
  console.log('Trying COMPOSIO_MULTI_EXECUTE_TOOL...')
  const multiResult = await callMcp('tools/call', {
    name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
    arguments: {
      current_step: 'FETCHING_FACEBOOK_POSTS',
      thought: 'Fetching Facebook page posts to analyze engagement',
      tools: [
        {
          tool_slug: 'FACEBOOK_GET_PAGE_POSTS',
          arguments: {
            page_id: FB_PAGE_ID,
            limit: 5,
            fields: 'id,message,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true)'
          }
        }
      ],
      sync_response_to_workbench: false
    }
  })
  
  console.log('Multi-execute result:', JSON.stringify(multiResult, null, 2).substring(0, 2000))
  
  // Try with session from search
  console.log('\n\n=== Try via Search Session ===')
  
  // First do search
  const searchResult = await callMcp('tools/call', {
    name: 'COMPOSIO_SEARCH_TOOLS',
    arguments: { queries: [{ use_case: 'facebook page posts' }] },
    session: { generate_id: true }
  })
  
  const sessionId = searchResult.session?.id
  console.log('Session ID from search:', sessionId)
  
  // Try to call the tool using the session
  if (sessionId) {
    const fbResult = await callMcp('tools/call', {
      name: 'FACEBOOK_GET_PAGE_POSTS',
      arguments: { page_id: FB_PAGE_ID, limit: 3 },
      session: { id: sessionId }
    })
    console.log('FB via session:', JSON.stringify(fbResult, null, 2).substring(0, 1000))
  }
  
  // Try direct GET to MCP endpoint
  console.log('\n\n=== Try Direct MCP Request ===')
  const directResult = await fetch(`${MCP_ENDPOINT}?tool=FACEBOOK_GET_PAGE_POSTS&page_id=${FB_PAGE_ID}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'x-consumer-api-key': API_KEY
    }
  })
  console.log('Direct result:', await directResult.text())
}

main()