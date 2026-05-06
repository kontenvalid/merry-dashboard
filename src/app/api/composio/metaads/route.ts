import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiKey } from '@/lib/api-key-store'

const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id || session.user.email

  try {
    const accessToken = await getApiKey(userId, 'meta_graph')

    if (!accessToken) {
      return NextResponse.json({
        success: true,
        connected: false,
        source: 'not_configured',
        accounts: META_ADS_ACCOUNTS,
        campaigns: [],
        summary: null
      })
    }

    const result = await fetchMetaAdsData(accessToken)

    return NextResponse.json({
      success: true,
      connected: result.campaigns.length > 0,
      source: 'meta_graph_api',
      accounts: META_ADS_ACCOUNTS,
      campaigns: result.campaigns,
      summary: result.campaigns.length > 0 ? result.summary : null
    })
  } catch (error: any) {
    console.error('Meta Ads API error:', error)
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message,
      accounts: META_ADS_ACCOUNTS,
      campaigns: [],
      summary: null
    }, { status: 500 })
  }
}

async function fetchMetaAdsData(accessToken: string) {
  const campaigns: any[] = []
  let totalSpend = 0
  let totalImpressions = 0
  let totalClicks = 0

  for (const account of META_ADS_ACCOUNTS) {
    try {
      const campaignsRes = await fetch(
        `https://graph.facebook.com/v21.0/${account.id}/campaigns?fields=id,name,status,objective,daily_budget,spend&access_token=${accessToken}`
      )
      
      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        
        for (const campaign of data.data || []) {
          const insightsRes = await fetch(
            `https://graph.facebook.com/v21.0/${campaign.id}/insights?fields=spend,impressions,clicks,cpc,ctr&access_token=${accessToken}`
          )
          
          const insights: any = {}
          if (insightsRes.ok) {
            const insightsData = await insightsRes.json()
            Object.assign(insights, insightsData.data?.[0] || {})
          }

          const spend = parseFloat(insights.spend || campaign.spend || '0')
          const impressions = parseInt(insights.impressions || '0')
          const clicks = parseInt(insights.clicks || '0')

          campaigns.push({
            accountId: account.id,
            accountName: account.name,
            currency: account.currency,
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            spend,
            impressions,
            clicks,
            cpc: insights.cpc || 0,
            ctr: insights.ctr || 0
          })

          totalSpend += spend
          totalImpressions += impressions
          totalClicks += clicks
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch campaigns for ${account.id}:`, e)
    }
  }

  return {
    campaigns,
    summary: {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalCampaigns: campaigns.length,
      avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0
    }
  }
}
