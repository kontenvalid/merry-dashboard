import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveApiKey, getApiKey } from '@/lib/api-key-store'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Return instructions for manual connection
    const callbackUrl = `${process.env.NEXTAUTH_URL || 'https://merry-dashboard.vercel.app'}/api/composio/callback`
    
    return NextResponse.json({
      success: false,
      requiresAuth: true,
      message: 'Please provide your x-consumer-api-key to connect',
      instructions: {
        step1: 'Enter your x-consumer-api-key in the input field above',
        step2: 'Click "Connect to Composio" button',
        step3: 'The system will verify your API key and generate MCP URL'
      },
      mcpEndpoint: 'https://backend.composio.dev/v3/mcp'
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

    const userId = session.user.id || session.user.email

    // Test the API key by making a simple request
    try {
      const testRes = await fetch('https://backend.composio.dev/api/v3.1/tools/execute/INSTAGRAM_GET_USER_INFO', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${consumerApiKey}`,
          'x-api-key': consumerApiKey,
          'x-consumer-api-key': consumerApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userId: 'me', 
          arguments: { ig_user_id: '27556603287273697' } 
        })
      })

      if (testRes.ok) {
        // API key works! Save to database
        await saveApiKey(userId, 'composio', consumerApiKey, { 
          addedAt: new Date().toISOString(),
          source: 'user_input',
          verified: true
        })

        // Generate MCP URL for future use
        const mcpUrl = `https://backend.composio.dev/v3/mcp?api_key=${consumerApiKey}`

        return NextResponse.json({
          success: true,
          connected: true,
          message: 'Successfully connected to Composio!',
          mcpUrl: mcpUrl,
          headers: {
            'Authorization': `Bearer ${consumerApiKey}`,
            'x-api-key': consumerApiKey
          }
        })
      } else {
        const errorData = await testRes.json()
        
        // If auth error, might need re-authentication
        if (testRes.status === 401) {
          // API key exists but needs re-auth with Composio
          const callbackUrl = `${process.env.NEXTAUTH_URL}/api/composio/callback`
          const authUrl = `https://connect.composio.dev/mcp?callback_url=${encodeURIComponent(callbackUrl)}&api_key=${consumerApiKey}`
          const savedMcpUrl = `https://backend.composio.dev/v3/mcp?api_key=${consumerApiKey}`
          
          // Still save the key (might be valid)
          await saveApiKey(userId, 'composio', consumerApiKey, {
            addedAt: new Date().toISOString(),
            source: 'user_input',
            needsAuth: true
          })

          return NextResponse.json({
            success: true,
            connected: false,
            message: 'API key saved but needs re-authentication with Composio',
            redirectUrl: authUrl,
            mcpUrl: savedMcpUrl,
            headers: {
              'x-api-key': consumerApiKey
            }
          })
        }

        return NextResponse.json({
          success: false,
          connected: false,
          error: errorData.error?.message || 'API key validation failed',
          message: 'Invalid API key or Composio service error'
        }, { status: 400 })
      }
    } catch (apiError: any) {
      console.error('Composio API test failed:', apiError)
      
      // Even if API fails, save the key - might work later
      await saveApiKey(userId, 'composio', consumerApiKey, {
        addedAt: new Date().toISOString(),
        source: 'user_input',
        needsAuth: true
      })

      return NextResponse.json({
        success: true,
        connected: false,
        message: 'API key saved. You may need to authenticate with Composio.',
        redirectUrl: 'https://connect.composio.dev/mcp',
        mcpUrl: `https://backend.composio.dev/v3/mcp?api_key=${consumerApiKey}`,
        headers: {
          'x-api-key': consumerApiKey
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