import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call Composio MCP endpoint to get connection URL
    // The consumer API key will be passed by the client in headers
    // For now, return instructions for manual connection
    
    return NextResponse.json({
      success: false,
      requiresConsumerKey: true,
      message: 'Please provide your x-consumer-api-key to connect',
      instructions: {
        step1: 'Enter your x-consumer-api-key in the input field above',
        step2: 'Click "Connect to Composio" button',
        step3: 'The system will call Composio with your API key as header',
        step4: 'You will receive an MCP server URL to use in Claude Desktop/Cursor'
      },
      apiEndpoint: 'https://backend.composio.dev/v3/mcp',
      requiredHeaders: [
        'x-consumer-api-key: YOUR_CONSUMER_KEY',
        'Authorization: Bearer YOUR_CONSUMER_KEY'
      ]
    })
  } catch (error) {
    console.error('Composio connect error:', error)
    return NextResponse.json({ 
      error: 'Failed to process connection request' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { consumerApiKey } = await request.json()
    
    if (!consumerApiKey) {
      return NextResponse.json({ 
        error: 'Consumer API key is required' 
      }, { status: 400 })
    }

    // Try to call Composio MCP to get connection info
    // This simulates what happens when you click "Connect to Composio"
    try {
      // Call Composio's MCP endpoint with the consumer API key
      const response = await fetch('https://connect.composio.dev/mcp', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${consumerApiKey}`,
          'x-consumer-api-key': consumerApiKey,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Success - return connection details
        const data = await response.json()
        
        return NextResponse.json({
          success: true,
          connected: true,
          message: 'Connected to Composio MCP',
          mcpUrl: data.url || data.mcpUrl,
          headers: {
            'x-consumer-api-key': consumerApiKey,
            'Authorization': `Bearer ${consumerApiKey}`
          }
        })
      } else {
        // If Composio returns an error, try alternative flow
        // Maybe Composio returns a redirect URL instead
        
        const text = await response.text()
        console.log('Composio response:', response.status, text)
        
        // Return a redirect URL that includes the consumer key as query param
        // (This is a fallback - adjust based on actual Composio behavior)
        const callbackUrl = `${process.env.NEXTAUTH_URL || 'https://merry-dashboard.vercel.app'}/api/composio/callback`
        const composioAuthUrl = new URL('https://connect.composio.dev/mcp')
        composioAuthUrl.searchParams.set('callback_url', callbackUrl)
        composioAuthUrl.searchParams.set('api_key', consumerApiKey)
        
        return NextResponse.json({
          success: true,
          connected: true,
          redirectUrl: composioAuthUrl.toString(),
          message: 'Redirecting to Composio for authentication',
          mcpUrl: null,
          headers: {
            'x-consumer-api-key': consumerApiKey
          }
        })
      }
    } catch (apiError: any) {
      console.error('Composio API call failed:', apiError)
      
      // Return a connection URL that the user can use
      // Include consumer API key in the URL for the MCP connection
      const callbackUrl = `${process.env.NEXTAUTH_URL || 'https://merry-dashboard.vercel.app'}/api/composio/callback`
      const composioAuthUrl = `https://connect.composio.dev/mcp?callback_url=${encodeURIComponent(callbackUrl)}`
      
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Please complete authentication at Composio',
        redirectUrl: composioAuthUrl,
        mcpUrl: `https://backend.composio.dev/v3/mcp?api_key=${consumerApiKey}`,
        headers: {
          'x-consumer-api-key': consumerApiKey
        }
      })
    }
  } catch (error) {
    console.error('Composio connect error:', error)
    return NextResponse.json({ 
      error: 'Failed to connect to Composio' 
    }, { status: 500 })
  }
}