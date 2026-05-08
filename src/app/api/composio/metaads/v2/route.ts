import { NextResponse } from 'next/server'
import { getApiKey } from '@/lib/api-key-store'

// Composio Meta Ads API wrapper
async function callComposioMetaAds(action: string, params: Record<string, any>) {
  const apiKey = await getApiKey('cmopvdcrn00004e1xbsct0hbq', 'composio')
  if (!apiKey) {
    throw new Error('No Composio API key found')
  }

  const response = await fetch(`https://api.composio.io/v1/tools/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `ApiKey ${apiKey}`
    },
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Composio API error: ${error}`)
  }

  return response.json()
}

export async function GET() {
  try {
    // Get ad accounts via Composio
    const accountsRes = await callComposioMetaAds('METAADS_GET_AD_ACCOUNTS', {
      fields: 'id,account_id,name,currency,account_status',
      limit: 10
    })

    const accounts = (accountsRes.data || []).map((acc: any) => ({
      id: acc.id,
      accountId: acc.account_id,
      name: acc.name,
      currency: acc.currency,
      status: acc.account_status
    }))

    // Get insights for each account
    const campaigns: any[] = []
    let totalSpend = 0
    let totalClicks = 0
    let totalImpressions = 0

    for (const account of accounts) {
      try {
        // Try to get account-level insights
        const insightsRes = await callComposioMetaAds('METAADS_GET_INSIGHTS', {
          object_id: account.id,
          level: 'account',
          fields: ['impressions', 'clicks', 'spend', 'reach', 'cpc', 'cpm'].join(','),
          date_preset: 'last_30d'
        })

        const insights = insightsRes.data?.[0] || {}
        
        const spend = parseFloat(insights.spend || '0')
        const clicks = parseInt(insights.clicks || '0')
        const impressions = parseInt(insights.impressions || '0')

        if (spend > 0 || clicks > 0 || impressions > 0) {
          campaigns.push({
            accountId: account.id,
            accountName: account.name,
            currency: account.currency,
            name: 'All Campaigns',
            status: 'ACTIVE',
            spend,
            impressions,
            clicks,
            reach: parseInt(insights.reach || '0'),
            cpc: parseFloat(insights.cpc || '0'),
            cpm: parseFloat(insights.cpm || '0')
          })

          totalSpend += spend
          totalClicks += clicks
          totalImpressions += impressions
        }
      } catch (e) {
        console.warn(`Failed to get insights for ${account.id}:`, e)
      }
    }

    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0

    return NextResponse.json({
      success: true,
      source: 'composio_metaads',
      timestamp: new Date().toISOString(),
      accounts: accounts.map((a: any) => ({
        id: a.id,
        name: a.name,
        currency: a.currency
      })),
      campaigns,
      summary: {
        totalSpend,
        totalCampaigns: campaigns.length,
        totalClicks,
        totalImpressions,
        avgCPC,
        avgCPM: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
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