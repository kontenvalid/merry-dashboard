import { NextResponse } from 'next/server'
import { getApiKey } from '@/lib/api-key-store'

// Meta Ads accounts - use the account that the token has access to
const META_ADS_ACCOUNTS = [
  { id: 'act_2061230484461298', currency: 'IDR', name: 'kontenval.id' }
]

// Meta Graph API base URL
const META_API_BASE = 'https://graph.facebook.com/v21.0'

export async function GET() {
  try {
    // Get Meta Graph API token from database
    const accessToken = await getApiKey('cmopvdcrn00004e1xbsct0hbq', 'meta_graph')

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No Meta Graph API token found',
        message: 'Please configure Meta Graph API token in Settings'
      }, { status: 400 })
    }

    const campaigns: any[] = []
    let totalSpend = 0
    let totalClicks = 0
    let totalImpressions = 0

    // Fetch campaigns for each account
    for (const account of META_ADS_ACCOUNTS) {
      try {
        // Get account-level insights
        const insightsRes = await fetch(
          `${META_API_BASE}/${account.id}/insights?fields=impressions,clicks,spend,reach,cpc,cpm&date_preset=last_30d&access_token=${accessToken}`
        )

        if (!insightsRes.ok) {
          const errorData = await insightsRes.json()
          console.warn(`Failed to fetch insights for ${account.id}:`, errorData)
          
          // Try with act_ prefix
          if (insightsRes.status === 400) {
            const altInsightsRes = await fetch(
              `${META_API_BASE}/${account.id.replace('act_', '')}/insights?fields=impressions,clicks,spend,reach,cpc,cpm&date_preset=last_30d&access_token=${accessToken}`
            )
            if (altInsightsRes.ok) {
              const altData = await altInsightsRes.json()
              if (altData.data?.length > 0) {
                for (const insight of altData.data) {
                  const spend = parseFloat(insight.spend || '0')
                  const clicks = parseInt(insight.clicks || '0')
                  const impressions = parseInt(insight.impressions || '0')

                  campaigns.push({
                    accountId: account.id,
                    accountName: account.name,
                    currency: account.currency,
                    name: 'Account Summary',
                    status: 'ACTIVE',
                    spend,
                    impressions,
                    clicks,
                    reach: parseInt(insight.reach || '0'),
                    cpc: parseFloat(insight.cpc || '0'),
                    cpm: parseFloat(insight.cpm || '0')
                  })

                  totalSpend += spend
                  totalClicks += clicks
                  totalImpressions += impressions
                }
              }
            }
          }
          continue
        }

        const insightsData = await insightsRes.json()

        if (insightsData.data?.length > 0) {
          for (const insight of insightsData.data) {
            const spend = parseFloat(insight.spend || '0')
            const clicks = parseInt(insight.clicks || '0')
            const impressions = parseInt(insight.impressions || '0')

            campaigns.push({
              accountId: account.id,
              accountName: account.name,
              currency: account.currency,
              name: 'Account Summary',
              status: 'ACTIVE',
              spend,
              impressions,
              clicks,
              reach: parseInt(insight.reach || '0'),
              cpc: parseFloat(insight.cpc || '0'),
              cpm: parseFloat(insight.cpm || '0')
            })

            totalSpend += spend
            totalClicks += clicks
            totalImpressions += impressions
          }
        } else {
          // No data - account exists but no spend/impressions
          campaigns.push({
            accountId: account.id,
            accountName: account.name,
            currency: account.currency,
            name: 'No active campaigns',
            status: 'INACTIVE',
            spend: 0,
            impressions: 0,
            clicks: 0,
            reach: 0,
            cpc: 0,
            cpm: 0
          })
        }
      } catch (e) {
        console.warn(`Error fetching data for ${account.id}:`, e)
      }
    }

    // Calculate summary
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0
    const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0

    return NextResponse.json({
      success: true,
      source: 'meta_graph_api',
      timestamp: new Date().toISOString(),
      accounts: META_ADS_ACCOUNTS,
      campaigns,
      summary: {
        totalSpend,
        totalCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
        totalClicks,
        totalImpressions,
        avgCPC,
        avgCPM
      }
    })
  } catch (error: any) {
    console.error('Meta Ads API error:', error)
    return NextResponse.json({
      success: false,
      source: 'error',
      error: error.message
    }, { status: 500 })
  }
}