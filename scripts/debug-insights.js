/**
 * Check available metrics from Facebook page insights
 */

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'
const API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'
const FB_PAGE_ID = '1080250281836384'

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

async function main() {
  console.log('=== Facebook Insights Full Report ===\n')
  
  // Get all available metrics
  const insights = await executeTool(API_KEY, 'FACEBOOK_GET_PAGE_INSIGHTS', { 
    page_id: FB_PAGE_ID,
    metrics: 'page_follows,page_impressions,page_post_engagements,page_views,page_actions_post_reactions_total,page_fan_count,page_views_total,page_posts_impressions'
  })
  
  if (insights?.data) {
    console.log('Available metrics:')
    for (const m of insights.data) {
      const values = m.values?.map(v => `${v.value}`).join(', ') || 'N/A'
      console.log(`  ${m.name}: ${values}`)
    }
  } else {
    console.log('No insights data:', JSON.stringify(insights)?.substring(0, 500))
  }
}

main().catch(console.error)