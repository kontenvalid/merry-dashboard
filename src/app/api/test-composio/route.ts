import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.COMPOSIO_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'COMPOSIO_API_KEY not set' }, { status: 500 })
  }
  
  try {
    // Test the new REST API endpoint
    const response = await fetch('https://backend.composio.dev/api/v3.1/tools/execute/INSTAGRAM_GET_USER_INFO', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'me',
        arguments: { ig_user_id: 'me' }
      })
    })
    
    const text = await response.text()
    
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      responseText: text.substring(0, 500)
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
