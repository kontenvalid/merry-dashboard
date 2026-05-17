import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasApiKey } from '@/lib/api-key-store'

// Platform IDs
const FB_PAGE_ID = '1080250281836384'
const YT_HANDLE = '@kontenvalid'

// Meta Ads account IDs
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized', connected: false }, { status: 401 })
  }

  const userId = session.user.id || session.user.email

  try {
    // Check API keys from database
    const [composioConnected, metaConnected] = await Promise.all([
      hasApiKey(userId, 'composio'),
      hasApiKey(userId, 'meta_graph')
    ])

    // Test Composio connection if configured
    let composioValid = false
    if (composioConnected) {
      composioValid = await testComposioConnection()
    }

    return NextResponse.json({
      connected: composioConnected && composioValid,
      requiresAuth: !composioConnected,
      authUrl: 'https://connect.composio.dev/mcp',
      services: {
        composio: {
          connected: composioConnected && composioValid,
          valid: composioValid
        },
        metaGraph: {
          connected: metaConnected,
          accounts: META_ADS_ACCOUNTS
        }
      },
      platforms: {
        facebook: { connected: composioConnected },
        instagram: { connected: composioConnected },
        youtube: { connected: composioConnected },
        metaAds: { connected: metaConnected, accounts: META_ADS_ACCOUNTS }
      }
    })
  } catch (error) {
    console.error('MCP status error:', error)
    return NextResponse.json({ 
      connected: false,
      error: 'Failed to check MCP status'
    }, { status: 500 })
  }
}

async function testComposioConnection(): Promise<boolean> {
  try {
    // Test with a simple API call
    const response = await fetch('https://backend.composio.dev/api/v3.1/tools/execute/facebook_graph_get_page_details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userId: 'me', 
        arguments: { page_id: FB_PAGE_ID } 
      })
    })
    
    // If we get a response (even error), the connection works
    return response.status !== 401 && response.status !== 403
  } catch (error) {
    console.error('Composio connection test failed:', error)
    return false
  }
}