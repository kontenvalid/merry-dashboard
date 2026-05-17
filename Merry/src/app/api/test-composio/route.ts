import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiKey } from '@/lib/api-key-store'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id || session.user.email
  const apiKey = await getApiKey(userId, 'composio')
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'Composio API key not configured', 
      message: 'Please connect Composio via Settings page' 
    }, { status: 400 })
  }
  
  try {
    // Test the Composio REST API endpoint
    const response = await fetch('https://backend.composio.dev/api/v3.1/tools/execute/INSTAGRAM_GET_USER_PROFILE', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'me',
        arguments: { user_id: 'me' }
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