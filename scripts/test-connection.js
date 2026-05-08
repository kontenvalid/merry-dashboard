/**
 * Test Composio MCP connection with consumer API key
 */

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'
const API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'

async function test() {
  console.log('🔗 Testing Composio MCP connection...\n')
  console.log('API Key:', API_KEY.substring(0, 10) + '...')
  
  // Test 1: List tools
  console.log('\n1. Listing tools...')
  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'x-consumer-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      })
    })
    
    console.log('   Status:', response.status)
    const text = await response.text()
    
    if (response.status === 200) {
      const data = JSON.parse(text)
      const tools = data.result?.tools || []
      console.log('   ✅ Connected! Tools available:', tools.length)
      
      // Group by platform
      const platforms = {}
      for (const tool of tools) {
        const name = tool.name || ''
        const parts = name.split('_')
        if (parts.length > 0) {
          const platform = parts[0]
          if (!platforms[platform]) platforms[platform] = []
          platforms[platform].push(name)
        }
      }
      
      console.log('\n   Platforms:')
      for (const [platform, toolList] of Object.entries(platforms)) {
        console.log(`   - ${platform}: ${toolList.length} tools`)
      }
    } else {
      console.log('   ❌ Error:', text.substring(0, 200))
    }
  } catch (e) {
    console.log('   ❌ Exception:', e.message)
  }
  
  // Test 2: Execute a simple tool
  console.log('\n2. Testing Facebook GET_PAGE_POSTS...')
  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'x-consumer-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
          arguments: {
            current_step: 'TEST',
            thought: 'Testing Facebook posts fetch',
            tools: [{
              tool_slug: 'FACEBOOK_GET_PAGE_POSTS',
              arguments: {
                page_id: '1080250281836384',
                limit: 3
              }
            }],
            sync_response_to_workbench: false
          }
        }
      })
    })
    
    console.log('   Status:', response.status)
    const text = await response.text()
    
    if (response.status === 200) {
      if (text.startsWith('event:')) {
        const dataLine = text.split('\n').find(l => l.startsWith('data:'))
        if (dataLine) {
          const data = JSON.parse(dataLine.substring(5))
          const result = data?.result?.content?.[0]?.text
          if (result) {
            const parsed = JSON.parse(result)
            const posts = parsed?.data?.results?.[0]?.response?.data?.data
            if (posts && posts.length > 0) {
              console.log('   ✅ Success! Posts fetched:', posts.length)
              console.log('   Sample:', posts[0].message?.substring(0, 50) + '...')
            } else {
              console.log('   ⚠️ No posts in response')
              console.log('   Raw:', text.substring(0, 300))
            }
          }
        }
      } else {
        console.log('   Raw:', text.substring(0, 200))
      }
    } else {
      console.log('   ❌ Error:', text.substring(0, 200))
    }
  } catch (e) {
    console.log('   ❌ Exception:', e.message)
  }
}

test().catch(console.error)