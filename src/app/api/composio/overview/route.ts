import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getConsumerApiKey } from '@/lib/composio-store'

// Platform IDs
const FB_PAGE_ID = '1080250281836384'
const YT_HANDLE = 'kontenvalid'

// Meta Ads account IDs
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'IDR Account 2' }
]

// In-memory cache for sync data (use Redis/DB in production)
let lastSyncData: {
  timestamp: Date
  data: any
} | null = null

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email || 'demo@kontenvalid.com'
    
    // Get API key from store or environment
    const apiKey = getConsumerApiKey(userEmail) || process.env.COMPOSIO_API_KEY

    if (!apiKey) {
      // Return mock data if no API key configured
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'Using demo data (no API key configured)',
        timestamp: new Date().toISOString(),
        data: getMockData()
      })
    }

    // Real Composio API call would go here
    // Using Composio MCP endpoint with x-api-key header
    try {
      const response = await fetch('https://backend.composio.dev/v3/mcp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          'x-consumer-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'get_overview_data',
            arguments: {}
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        lastSyncData = {
          timestamp: new Date(),
          data: data.result
        }
        
        return NextResponse.json({
          success: true,
          timestamp: lastSyncData.timestamp.toISOString(),
          data: data.result
        })
      }
    } catch (apiError) {
      console.warn('Composio API call failed, using mock data:', apiError)
    }

    // Fallback to mock data
    return NextResponse.json({
      success: true,
      demo: true,
      fallback: true,
      message: 'Using demo data (API unavailable)',
      timestamp: new Date().toISOString(),
      data: getMockData()
    })
  } catch (error) {
    console.error('Overview sync error:', error)
    // Return mock data on error
    return NextResponse.json({
      success: false,
      fallback: true,
      error: 'Sync failed, using demo data',
      timestamp: new Date().toISOString(),
      data: getMockData()
    })
  }
}

function getMockData() {
  return {
    facebook: {
      pageId: FB_PAGE_ID,
      pageName: 'Konten Valid',
      followers: 125000,
      engagement: {
        likes: 2500,
        comments: 180,
        shares: 95
      },
      posts: {
        total: 342,
        reach: 2500000,
        impressions: 5200000
      },
      lastUpdated: new Date().toISOString()
    },
    instagram: {
      username: '@kontenvalid',
      followers: 89000,
      engagement: {
        likes: 3200,
        comments: 210,
        saves: 450
      },
      posts: {
        total: 256,
        reach: 1800000,
        impressions: 3100000
      },
      stories: {
        dailyViews: 15000
      },
      lastUpdated: new Date().toISOString()
    },
    youtube: {
      channelId: 'UC123456789',
      channelName: 'Konten Valid',
      handle: YT_HANDLE,
      subscribers: 156000,
      stats: {
        totalViews: 12500000,
        videoCount: 198,
        avgWatchTime: '4:32'
      },
      engagement: {
        likes: 45000,
        comments: 3200,
        shares: 8900
      },
      topVideo: {
        title: 'Tips Produktif 2024',
        views: 850000
      },
      lastUpdated: new Date().toISOString()
    },
    metaAds: {
      accounts: META_ADS_ACCOUNTS.map(account => ({
        ...account,
        performance: {
          impressions: 500000,
          clicks: 12500,
          spend: account.currency === 'USD' ? 1250.00 : 18500000,
          conversions: 342,
          ctr: 2.5,
          cpc: account.currency === 'USD' ? 0.10 : 1480,
          roas: 4.2
        }
      })),
      totalSpend: {
        USD: 1250.00,
        IDR: 18500000
      },
      lastUpdated: new Date().toISOString()
    },
    syncStatus: {
      lastSync: new Date().toISOString(),
      nextSync: new Date(Date.now() + 3600000).toISOString(),
      status: 'success'
    }
  }
}