import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchDashboardData } from '@/lib/dashboard-data'
import { getApiKey } from '@/lib/api-key-store'

// Meta Ads accounts
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]

// Fetch Meta Ads data
async function fetchMetaAdsData(accessToken: string) {
  const campaigns: any[] = []
  let totalSpend = 0

  for (const account of META_ADS_ACCOUNTS) {
    try {
      const campaignsRes = await fetch(
        `https://graph.facebook.com/v21.0/${account.id}/campaigns?fields=id,name,status,daily_budget,spend&access_token=${accessToken}`
      )
      
      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        
        for (const campaign of data.data || []) {
          const insightsRes = await fetch(
            `https://graph.facebook.com/v21.0/${campaign.id}/insights?fields=spend,impressions,clicks&access_token=${accessToken}`
          )
          
          const insights: any = {}
          if (insightsRes.ok) {
            const insightsData = await insightsRes.json()
            Object.assign(insights, insightsData.data?.[0] || {})
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
          })

          totalSpend += spend
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch campaigns for ${account.id}`)
    }
  }

  return {
    connected: campaigns.length > 0 || !!accessToken,
    accounts: META_ADS_ACCOUNTS,
    campaigns,
    summary: {
      totalSpend,
      totalCampaigns: campaigns.length,
      avgCPC: campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0) > 0 
        ? totalSpend / campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0) 
        : 0
    }
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id || session.user.email

  try {
    // Fetch dashboard data from database
    const data = await fetchDashboardData(userId)
    
    // Get Meta Ads data separately
    const metaToken = await getApiKey(userId, 'meta_graph')
    const metaAds = metaToken ? await fetchMetaAdsData(metaToken) : data.metaAds
    
    return NextResponse.json({
      success: true,
      source: data.source,
      timestamp: data.timestamp,
      data: {
        facebook: data.facebook,
        instagram: data.instagram,
        youtube: data.youtube,
        metaAds: metaAds,
        googleDrive: data.googleDrive
      }
    })
  } catch (error: any) {
    console.error('Overview API error:', error)
    return NextResponse.json({
      success: false,
      source: 'error',
      error: error.message
    }, { status: 500 })
  }
}