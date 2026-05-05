import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.COMPOSIO_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'COMPOSIO_API_KEY not set' }, { status: 500 })
  }
  
  try {
    const response = await fetch('https://backend.composio.dev/v3/mcp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'INSTAGRAM_GET_USER_INFO',
          arguments: { ig_user_id: 'me' }
        }
      })
    })
    
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({
        status: response.status,
        statusText: response.statusText,
        error: 'Failed to parse JSON',
        responseText: text.substring(0, 500)
      })
    }
    
    return NextResponse.json({
      status: response.status,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      data
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
