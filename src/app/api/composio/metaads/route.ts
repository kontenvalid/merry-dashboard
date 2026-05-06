import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiKey } from '@/lib/api-key-store'
import prisma from '@/lib/prisma'

// Meta Ads account IDs
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
    // Get API key from database
    const accessToken = await getApiKey(userId, 'meta_graph')

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Meta Ads access token not configured',
        accounts: META_ADS_ACCOUNTS,
        campaigns: []
      })
    }

    // Fetch from Meta Graph API
    const result = await fetchMetaAdsData(accessToken)

    return NextResponse.json({
      success: true,
      source: 'meta_graph_api',
      accounts: META_ADS_ACCOUNTS,
      campaigns: result.campaigns,
      adSets: result.adSets,
      ads: result.ads,
      summary: result.summary
    })
  } catch (error: any) {
    console.error('Meta Ads API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      accounts: META_ADS_ACCOUNTS,
      campaigns: []
    }, { status: 500 })
  }
}

async function fetchMetaAdsData(accessToken: string) {
  const campaigns: any[] = []
  const adSets: any[] = []
  const ads: any[] = []
  let totalSpend = 0

  // Fetch campaigns from each active account
  for (const account of META_ADS_ACCOUNTS) {
    try {
      // Get campaigns
      const campaignsRes = await fetch(
        `https://graph.facebook.com/v21.0/${account.id}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,spend&access_token=${accessToken}`
      )
      
      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        
        for (const campaign of data.data || []) {
          // Get campaign insights
          const insightsRes = await fetch(
            `https://graph.facebook.com/v21.0/${campaign.id}/insights?fields=spend,impressions,clicks,cpc,ctr&access_token=${accessToken}`
          )
          
          const insights: any = {}
          if (insightsRes.ok) {
            const insightsData = await insightsRes.json()
            Object.assign(insights, insightsData.data?.[0] || {})
          }

          campaigns.push({
            accountId: account.id,
            accountName: account.name,
            currency: account.currency,
            ...campaign,
            ...insights
          })

          totalSpend += parseFloat(insights.spend || '0')
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch campaigns for ${account.id}:`, e)
    }
  }

  return {
    campaigns,
    adSets,
    ads,
    summary: {
      totalCampaigns: campaigns.length,
      totalAccounts: META_ADS_ACCOUNTS.length,
      totalSpend,
      avgCPC: campaigns.length > 0 ? totalSpend / (campaigns.reduce((acc, c) => acc + (c.clicks || 0), 1)) : 0
    }
  }
}