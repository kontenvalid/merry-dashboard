import { NextResponse } from 'next/server'
import { getApiKey } from '@/lib/api-key-store'

// Meta Ads accounts
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
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

    // Fetch campaigns for each account
    for (const account of META_ADS_ACCOUNTS) {
      try {
        // Get campaigns
        const campaignsRes = await fetch(
          `${META_API_BASE}/${account.id}/campaigns?fields=id,name,status,daily_budget,spend&access_token=${accessToken}`
        )

        if (!campaignsRes.ok) {
          console.warn(`Failed to fetch campaigns for ${account.id}: ${campaignsRes.status}`)
          continue
        }

        const campaignsData = await campaignsRes.json()

        for (const campaign of campaignsData.data || []) {
          // Get insights for each campaign
          const insightsRes = await fetch(
            `${META_API_BASE}/${campaign.id}/insights?fields=spend,impressions,clicks&access_token=${accessToken}`
          )

          let insights: any = {}
          if (insightsRes.ok) {
            const insightsData = await insightsRes.json()
            insights = insightsData.data?.[0] || {}
          }

          const spend = parseFloat(insights.spend || campaign.spend || '0')

          campaigns.push({
            accountId: account.id,
            accountName: account.name,
            currency: account.currency,
            name: campaign.name,
            status: campaign.status,
            spend: spend || undefined,
            impressions: parseInt(insights.impressions || '0') || undefined,
            clicks: parseInt(insights.clicks || '0') || undefined,
            budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : undefined
          })

          totalSpend += spend
        }
      } catch (e) {
        console.warn(`Error fetching data for ${account.id}:`, e)
      }
    }

    // Calculate summary
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0)
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0

    return NextResponse.json({
      success: true,
      source: 'meta_graph_api',
      timestamp: new Date().toISOString(),
      accounts: META_ADS_ACCOUNTS,
      campaigns,
      summary: {
        totalSpend,
        totalCampaigns: campaigns.length,
        totalClicks,
        avgCPC
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