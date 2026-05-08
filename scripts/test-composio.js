/**
 * Debug Composio response parsing
 */

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'
const API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'

async function test() {
  console.log('Testing Composio MCP and parsing...\n')
  
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
            thought: 'Testing Facebook tool',
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
    
    const text = await response.text()
    console.log('Raw response length:', text.length)
    console.log('First 200 chars:', text.substring(0, 200))
    console.log('\n---')
    
    // Parse the SSE response like in the code
    let parsed
    if (text.startsWith('event:')) {
      const lines = text.split('\n')
      const dataLine = lines.find(l => l.startsWith('data:'))
      if (dataLine) {
        console.log('Found data line')
        parsed = JSON.parse(dataLine.substring(5))
      }
    }
    
    if (!parsed) {
      parsed = JSON.parse(text)
    }
    
    console.log('\nParsed object keys:', Object.keys(parsed))
    console.log('result keys:', parsed.result ? Object.keys(parsed.result) : 'no result')
    
    // Try the code's parsing logic
    const contentText = parsed?.result?.content?.[0]?.text
    if (contentText) {
      console.log('\ncontent[0].text found, parsing...')
      const innerParsed = JSON.parse(contentText)
      console.log('inner parsed keys:', Object.keys(innerParsed))
      
      // Check data structure
      const results = innerParsed?.data?.results
      if (results && results.length > 0) {
        console.log('\nresults[0] keys:', Object.keys(results[0]))
        console.log('results[0].response keys:', results[0].response ? Object.keys(results[0].response) : 'no response')
        
        const responseData = results[0].response?.data
        console.log('response.data:', typeof responseData, responseData)
        
        if (responseData && responseData.data) {
          console.log('\n✅ Found posts! Count:', responseData.data.length)
          console.log('First post:', JSON.stringify(responseData.data[0]).substring(0, 200))
        }
      }
    }
    
  } catch (e) {
    console.error('Error:', e.message)
    console.error(e.stack)
  }
}

test().catch(console.error)