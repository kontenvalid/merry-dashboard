// Test sync directly
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'
const API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'
const FB_PAGE_ID = '1080250281836384'
const IG_USER_ID = '27556603287273697'
const YT_CHANNEL_ID = 'UCK2C25kK4E3PR6w0gPNCjaA'

async function callMcp(apiKey, method, params) {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  })

  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-consumer-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body
    })

    const text = await response.text()
    console.log(`MCP ${method}: status=${response.status}, length=${text.length}`)
    
    if (text.startsWith('event:')) {
      const jsonPart = text.split('\n').find(line => line.startsWith('data:'))
      if (jsonPart) return JSON.parse(jsonPart.substring(5))
    }
    
    return JSON.parse(text)
  } catch (error) {
    console.log(`MCP error: ${error.message}`)
    return { error: error.message }
  }
}

async function executeTool(apiKey, toolSlug, args) {
  const result = await callMcp(apiKey, 'tools/call', {
    name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
    arguments: {
      current_step: 'SYNC',
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

async function main() {
  console.log('=== Testing MCP Sync ===\n')
  
  // Test Facebook
  console.log('1. Facebook GET_PAGE_POSTS:')
  const fbPosts = await executeTool(API_KEY, 'FACEBOOK_GET_PAGE_POSTS', { page_id: FB_PAGE_ID, limit: 5 })
  console.log('   Result:', fbPosts?.data ? `${fbPosts.data.length} posts` : JSON.stringify(fbPosts)?.substring(0, 100))
  
  // Test Instagram
  console.log('\n2. Instagram GET_IG_USER_MEDIA:')
  const igMedia = await executeTool(API_KEY, 'INSTAGRAM_GET_IG_USER_MEDIA', { ig_user_id: IG_USER_ID, limit: 5 })
  console.log('   Result:', igMedia?.data ? `${igMedia.data.length} posts` : JSON.stringify(igMedia)?.substring(0, 100))
  
  // Test YouTube
  console.log('\n3. YouTube GET_CHANNEL_STATISTICS:')
  const ytStats = await executeTool(API_KEY, 'YOUTUBE_GET_CHANNEL_STATISTICS', { channel_id: YT_CHANNEL_ID })
  console.log('   Result:', ytStats?.statistics ? JSON.stringify(ytStats.statistics) : JSON.stringify(ytStats)?.substring(0, 200))
  
  // Test Google Drive
  console.log('\n4. Google Drive LIST_FILES:')
  const gdrive = await executeTool(API_KEY, 'GOOGLEDRIVE_LIST_DRIVE_FILES', { page_size: 5 })
  console.log('   Result:', gdrive?.files ? `${gdrive.files.length} files` : JSON.stringify(gdrive)?.substring(0, 100))
  
  console.log('\n=== Done ===')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })