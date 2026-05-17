import { NextResponse } from 'next/server'

const COMPOSIO_API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'
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
  return res.text()
}

async function testTool(toolName: string, args: any) {
  console.log(`\n🔧 Testing ${toolName}...`)
  console.log(`   Args:`, JSON.stringify(args))
  
  const text = await callMcp('tools/call', {
    name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
    arguments: {
      current_step: 'TEST',
      thought: `Testing ${toolName}`,
      tools: [{ tool_slug: toolName, arguments: args }],
      sync_response_to_workbench: false
    }
  })
  
  console.log(`   Raw response (${text.length} chars):`, text.substring(0, 500))
  
  // Try to parse
  try {
    // Handle SSE format
    let jsonStr = text
    if (text.startsWith('event:')) {
      const lines = text.split('\n')
      const dataLine = lines.find(l => l.startsWith('data:'))
      if (dataLine) jsonStr = dataLine.substring(5)
    }
    
    const parsed = JSON.parse(jsonStr)
    const content = parsed?.result?.content?.[0]?.text
    console.log(`   Content text:`, content?.substring(0, 300))
    
    if (content) {
      const inner = JSON.parse(content)
      console.log(`   Parsed inner:`, JSON.stringify(inner).substring(0, 300))
      return { success: true, data: inner }
    }
    
    return { success: false, error: 'No content in result', raw: text.substring(0, 200) }
  } catch (e: any) {
    console.log(`   Parse error:`, e.message)
    return { success: false, error: e.message, raw: text.substring(0, 200) }
  }
}

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  // 1. List available tools
  console.log('🔗 Testing tools/list...')
  const toolsList = await callMcp('tools/list', {})
  try {
    const parsed = JSON.parse(toolsList)
    const toolNames = Object.keys(parsed.result || {})
    console.log(`   Found ${toolNames.length} tools`)
    results.tools = toolNames.slice(0, 20)
  } catch (e) {
    results.toolsError = toolsList.substring(0, 200)
  }

  // 2. Test Facebook
  results.tests.facebook = await testTool('FACEBOOK_GET_PAGE_POSTS', {
    page_id: '1080250281836384',
    limit: 3
  })

  // 3. Test Instagram
  results.tests.instagram = await testTool('INSTAGRAM_GET_IG_USER_MEDIA', {
    ig_user_id: '27556603287273697',
    limit: 3
  })

  // 4. Test YouTube
  results.tests.youtube = await testTool('YOUTUBE_GET_CHANNEL_STATISTICS', {
    channel_id: 'UCK2C25kK4E3PR6w0gPNCjaA'
  })

  // 5. Test Google Drive
  results.tests.gdrive = await testTool('GOOGLEDRIVE_LIST_FILES', {
    max_results: 10
  })

  return NextResponse.json(results)
}