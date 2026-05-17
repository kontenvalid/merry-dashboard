import { NextResponse } from 'next/server'

// Minimal sync - just test basic flow
export async function GET() {
  try {
    const results: any = {
      steps: [],
      errors: []
    }

    // Step 1: Import modules
    results.steps.push('1. Importing modules...')
    const { getApiKey } = await import('@/lib/api-key-store')
    const prisma = (await import('@/lib/prisma')).default

    // Step 2: Check API keys
    results.steps.push('2. Checking API keys...')
    const userId = 'kontenval.id@gmail.com'
    const apiKey = await getApiKey(userId, 'composio')
    const metaToken = await getApiKey(userId, 'meta_graph')
    
    results.apiKeys = {
      composio: apiKey ? `Found (${apiKey.substring(0, 20)}...)` : 'NOT FOUND',
      meta_graph: metaToken ? `Found (${metaToken.substring(0, 20)}...)` : 'NOT FOUND'
    }

    if (!apiKey) {
      results.errors.push('No Composio API key')
    }

    // Step 3: If we have key, try MCP
    if (apiKey) {
      results.steps.push('3. Testing MCP connection...')
      
      const response = await fetch('https://connect.composio.dev/mcp', {
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
          method: 'tools/list',
          params: {}
        })
      })

      const text = await response.text()
      
      if (response.ok) {
        results.mcpConnected = true
        results.steps.push('✅ MCP connection OK')
        
        // Try multi-execute
        results.steps.push('4. Testing Facebook tool...')
        const multiResult = await fetch('https://connect.composio.dev/mcp', {
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
            method: 'tools/call',
            params: {
              name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
              arguments: {
                current_step: 'TEST',
                thought: 'Test',
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

        const multiText = await multiResult.text()
        results.facebookTest = multiText.substring(0, 500)
        
        // Try to parse JSON
        try {
          const parsed = JSON.parse(multiText)
          const content = parsed?.result?.content?.[0]?.text
          if (content) {
            const inner = JSON.parse(content)
            results.facebookData = inner?.data?.results?.[0]?.response?.data?.slice(0, 2)
          }
        } catch (e) {
          results.parseError = String(e)
        }
        
      } else {
        results.mcpConnected = false
        results.mcpError = text.substring(0, 200)
      }
    }

    // Step 4: Check DB
    results.steps.push('5. Checking database...')
    const analyticsCount = await prisma.analytics.count()
    results.dbAnalyticsCount = analyticsCount

    // Step 5: Try to save a test record
    if (results.facebookData && results.facebookData.length > 0) {
      results.steps.push('6. Saving to database...')
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const post = results.facebookData[0]
      const likes = post?.reactions?.summary?.total_count || 0
      const comments = post?.comments?.summary?.total_count || 0
      const shares = post?.shares?.count || 0

      await prisma.analytics.upsert({
        where: { platform_date: { platform: 'FACEBOOK', date: today } },
        update: { followers: 6, posts: 1, likes, comments, shares, engagement: likes + comments + shares },
        create: { platform: 'FACEBOOK', date: today, followers: 6, posts: 1, likes, comments, shares, engagement: likes + comments + shares }
      })

      results.saved = true
      results.steps.push('✅ Saved to database')
    }

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      step: 'UNHANDLED_ERROR'
    }, { status: 500 })
  }
}