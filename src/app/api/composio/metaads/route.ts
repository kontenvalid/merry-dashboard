import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getConsumerApiKey } from '@/lib/composio-store'

// Meta Ads account IDs  
const META_ADS_ACCOUNTS = [
  { id: 'act_2180078045608935', currency: 'IDR', name: 'Indonesian Account' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email || 'demo@kontenvalid.com'
    
    // Get API key from store
    const apiKey = getConsumerApiKey(userEmail) || process.env.COMPOSIO_API_KEY

    let connected = false
    let campaigns: any[] = []
    let daily: any[] = []
    let summary = { totalSpend: 0, totalImpressions: 0, totalConversions: 0, averageCTR: 0, averageROAS: 0 }

    if (apiKey) {
      try {
        const result = await fetchFromComposio(apiKey, META_ADS_ACCOUNTS.map(a => a.id))
        if (result) {
          connected = true
          campaigns = result.campaigns || []
          daily = result.daily || []
          summary = result.summary || summary
        }
      } catch (e) {
        console.warn('Meta Ads fetch via Composio failed:', e)
      }
    }

    // If not connected or no data, return demo data message
    if (!connected || campaigns.length === 0) {
      return NextResponse.json({
        connected: false,
        error: 'Meta Ads not connected. Configure Composio API key in Settings to sync ad data.',
        accounts: META_ADS_ACCOUNTS,
        demo: {
          campaigns: [
            { id: 'camp_1', name: 'Affiliate Promo Campaign', status: 'ACTIVE', spend: 1250000, impressions: 45000, clicks: 890, conversions: 45, ctr: 1.98, cpc: 1404, roas: 3.2 },
            { id: 'camp_2', name: 'Digital Product Launch', status: 'ACTIVE', spend: 850000, impressions: 32000, clicks: 560, conversions: 28, ctr: 1.75, cpc: 1518, roas: 4.1 },
            { id: 'camp_3', name: 'Brand Awareness', status: 'PAUSED', spend: 500000, impressions: 78000, clicks: 420, conversions: 12, ctr: 0.54, cpc: 1190, roas: 1.8 }
          ],
          daily: [
            { date: '2026-04-27', spend: 45000, impressions: 5200, conversions: 8 },
            { date: '2026-04-28', spend: 52000, impressions: 6100, conversions: 12 },
            { date: '2026-04-29', spend: 38000, impressions: 4500, conversions: 6 },
            { date: '2026-04-30', spend: 65000, impressions: 7200, conversions: 15 },
            { date: '2026-05-01', spend: 58000, impressions: 6800, conversions: 11 },
            { date: '2026-05-02', spend: 72000, impressions: 8100, conversions: 18 },
            { date: '2026-05-03', spend: 62000, impressions: 7000, conversions: 14 }
          ]
        },
        summary: {
          totalSpend: 2600000,
          totalImpressions: 127000,
          totalConversions: 85,
          averageCTR: 1.42,
          averageROAS: 3.03
        }
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      })
    }

    // Return real data
    return NextResponse.json({
      connected: true,
      accounts: META_ADS_ACCOUNTS,
      campaigns,
      daily,
      summary
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Meta Ads sync error:', error)
    return NextResponse.json({
      connected: false,
      error: 'Failed to sync Meta Ads',
      accounts: META_ADS_ACCOUNTS
    }, { status: 500 })
  }
}

async function fetchFromComposio(apiKey: string, accountIds: string[]) {
  // Call Composio Meta Ads tool
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
        name: 'get_meta_ads_performance',
        arguments: {
          ad_account_ids: accountIds,
          date_range: 'last_7_days'
        }
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Composio API error: ${response.status}`)
  }

  const data = await response.json()
  return data.result || data
}