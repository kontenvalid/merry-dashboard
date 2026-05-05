import { NextResponse } from 'next/server'
import { getConsumerApiKey } from '@/lib/composio-store'

export async function GET() {
  const apiKey = process.env.COMPOSIO_API_KEY || 'test'
  
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
    
    const data = await response.json()
    
    return NextResponse.json({
      status: response.status,
      apiKeySet: !!process.env.COMPOSIO_API_KEY,
      apiKeyPrefix: process.env.COMPOSIO_API_KEY?.substring(0, 10) || 'NOT SET',
      data
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      apiKeySet: !!process.env.COMPOSIO_API_KEY
    }, { status: 500 })
  }
}
