import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Platform IDs
const FB_PAGE_ID = '1080250281836384'
const YT_HANDLE = '@kontenvalid'

// Meta Ads account IDs
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'IDR Account 2' }
]

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', connected: false }, { status: 401 })
  }

  try {
    const apiKey = process.env.COMPOSIO_API_KEY
    
    // Check if API key is configured
    if (!apiKey) {
      // No API key configured - user needs to connect via Composio
      return NextResponse.json({
        connected: false,
        requiresAuth: true,
        authUrl: 'https://connect.composio.dev/mcp',
        message: 'Connect your Composio account to enable social media monitoring'
      })
    }

    // API key is configured - check if it's valid by testing the connection
    const isValid = await testComposioConnection(apiKey)
    
    if (isValid) {
      return NextResponse.json({
        connected: true,
        requiresAuth: false,
        message: 'Connected to Composio MCP',
        platforms: {
          facebook: { connected: true },
          instagram: { connected: true },
          youtube: { connected: true },
          metaAds: { connected: true, accounts: META_ADS_ACCOUNTS }
        }
      })
    } else {
      return NextResponse.json({
        connected: false,
        requiresAuth: true,
        authUrl: 'https://connect.composio.dev/mcp',
        message: 'API key invalid or expired. Please reconnect.'
      })
    }
  } catch (error) {
    console.error('MCP status error:', error)
    return NextResponse.json({ 
      connected: false,
      error: 'Failed to check MCP status'
    }, { status: 500 })
  }
}

async function testComposioConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.composio.dev/v2/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    return response.ok
  } catch (error) {
    console.error('Composio connection test failed:', error)
    return false
  }
}