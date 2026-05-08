const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'
const API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'
const IG_USER_ID = '27556603287273697'

async function callMcp(apiKey, method, params) {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  })

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
      current_step: 'CHECK',
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
  console.log('=== Checking Instagram Account ===\n')
  console.log('IG User ID being used:', IG_USER_ID)
  console.log('')
  
  // Get IG User Info
  console.log('1. Getting IG User Info...')
  const igInfo = await executeTool(API_KEY, 'INSTAGRAM_GET_IG_USER_INFO', { ig_user_id: IG_USER_ID })
  console.log('Response:', JSON.stringify(igInfo, null, 2)?.substring(0, 500))
  
  console.log('\n2. Getting IG User Media...')
  const igMedia = await executeTool(API_KEY, 'INSTAGRAM_GET_IG_USER_MEDIA', { ig_user_id: IG_USER_ID, limit: 3 })
  if (igMedia?.data) {
    console.log('Media count:', igMedia.data.length)
    if (igMedia.data.length > 0) {
      console.log('First post username:', igMedia.data[0].username)
      console.log('First post caption (first 100 chars):', igMedia.data[0].caption?.substring(0, 100))
    }
  } else {
    console.log('Response:', JSON.stringify(igMedia)?.substring(0, 300))
  }
  
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); prisma.$disconnect() })