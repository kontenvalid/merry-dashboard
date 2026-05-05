import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMetaAccessToken } from '@/lib/meta-token'

// Meta Ads account IDs  
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'IDR', name: 'Satria Ady Chandra', status: 'disabled' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'Satria Ady Chandra', status: 'active' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun', status: 'active' }
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email || 'demo@kontenvalid.com'
    
    // Get user's stored Meta token (from env or user store)
    const metaAccessToken = getMetaAccessToken(userEmail)
    const activeAccounts = META_ADS_ACCOUNTS.filter(a => a.status === 'active')
    
    // ========================================
    // MODE 1: Graph API FIRST (Primary)
    // ========================================
    if (metaAccessToken) {
      let allCampaigns: any[] = []
      let allDailyData: any[] = []
      let totalSpend = 0
      let totalImpressions = 0
      let totalConversions = 0

      for (const account of activeAccounts) {
        try {
          // Get campaigns for this account
          const campaignsData = await fetchFacebookData(
            `/v18.0/${account.id}/campaigns`,
            metaAccessToken,
            'id,name,status,objective,daily_budget,lifetime_budget,spend'
          )
          
          if (campaignsData?.data?.length > 0) {
            for (const campaign of campaignsData.data) {
              // Get insights for each campaign
              const insightsData = await fetchFacebookData(
                `/v18.0/${campaign.id}/insights`,
                metaAccessToken,
                'spend,impressions,clicks,reach,actions',
                'date_preset=last_7d'
              )
              
              // Calculate conversions
              let conversions = 0
              if (insightsData?.data?.[0]) {
                const insight = insightsData.data[0]
                conversions = insight.actions?.find((a: any) => 
                  a.action_type.includes('purchase') || a.action_type.includes('lead')
                )?.value || 0
                if (typeof conversions === 'string') conversions = parseInt(conversions)
              }
              
              const campaignSpend = parseFloat(campaign.spend || 0)
              const campaignImpressions = parseInt(insightsData?.data?.[0]?.impressions || 0)
              const campaignClicks = parseInt(insightsData?.data?.[0]?.clicks || 0)
              
              allCampaigns.push({
                id: campaign.id,
                name: campaign.name,
                status: campaign.status === 'ACTIVE' ? 'active' : 'paused',
                objective: campaign.objective,
                budget: campaign.daily_budget || campaign.lifetime_budget || 0,
                spend: campaignSpend,
                impressions: campaignImpressions,
                clicks: campaignClicks,
                conversions: conversions,
                ctr: campaignImpressions > 0 ? ((campaignClicks / campaignImpressions) * 100).toFixed(2) : 0,
                roas: campaignSpend > 0 ? (conversions * 100000 / campaignSpend).toFixed(2) : 0,
                accountId: account.id,
                accountName: account.name
              })
              
              totalSpend += campaignSpend
              totalImpressions += campaignImpressions
              totalConversions += conversions
            }
          }
          
          // Get daily insights for account
          const dailyData = await fetchFacebookData(
            `/v18.0/${account.id}/insights`,
            metaAccessToken,
            'spend,impressions,clicks,reach,date_start,date_stop,actions',
            'date_preset=last_7d'
          )
          
          if (dailyData?.data) {
            allDailyData.push(...dailyData.data)
          }
        } catch (e) {
          console.warn(`Failed to fetch data for account ${account.id}:`, e)
        }
      }
      
      // Remove duplicates and sort daily data by date
      const uniqueDaily = allDailyData.filter((item, index, self) => 
        index === self.findIndex(t => t.date_start === item.date_start)
      ).sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
      
      // If we have real data, return it
      if (allCampaigns.length > 0) {
        return NextResponse.json({
          source: 'facebook_graph_api',
          connected: true,
          tokenValid: true,
          accounts: META_ADS_ACCOUNTS,
          campaigns: allCampaigns,
          daily: uniqueDaily.map(d => ({
            date: new Date(d.date_start).toLocaleDateString('en-US', { weekday: 'short' }),
            spend: parseFloat(d.spend || 0),
            impressions: parseInt(d.impressions || 0),
            clicks: parseInt(d.clicks || 0),
            conversions: d.actions?.find((a: any) => a.action_type.includes('purchase'))?.value || 0
          })),
          summary: {
            totalSpend,
            totalImpressions,
            totalConversions,
            averageCTR: totalImpressions > 0 ? ((totalConversions / totalImpressions) * 100).toFixed(2) : 0,
            averageROAS: totalSpend > 0 ? (totalConversions * 100000 / totalSpend).toFixed(2) : 0
          }
        }, {
          headers: { 'Cache-Control': 'no-store' }
        })
      }
      
      // Token is valid but no campaigns found - try Composio as fallback
      console.log('Graph API: No campaigns found, trying Composio...')
    }
    
    // ========================================
    // MODE 2: Composio FALLBACK
    // ========================================
    try {
      const composioKey = process.env.COMPOSIO_API_KEY
      if (composioKey && composioKey !== 'your-composio-api-key-here') {
        const response = await fetch('https://backend.composio.dev/v3/mcp', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${composioKey}`,
            'x-api-key': composioKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
              name: 'get_meta_ads_performance',
              arguments: { account_ids: activeAccounts.map(a => a.id) }
            }
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          const composioData = data.result || data
          
          if (composioData?.campaigns?.length > 0) {
            return NextResponse.json({
              source: 'composio',
              connected: true,
              accounts: META_ADS_ACCOUNTS,
              campaigns: composioData.campaigns,
              daily: composioData.daily || [],
              summary: composioData.summary
            }, {
              headers: { 'Cache-Control': 'no-store' }
            })
          }
        }
      }
    } catch (e) {
      console.log('Composio not available for Meta Ads, will use demo data')
    }
    
    // ========================================
    // MODE 3: Demo data (final fallback)
    // ========================================
    return NextResponse.json({
      connected: false,
      tokenValid: !!metaAccessToken,
      source: 'demo',
      error: metaAccessToken 
        ? 'Graph API returned no campaigns. Try checking your Meta Ads Manager.'
        : 'Add your long-lived Meta token in Settings to sync real ad data.',
      accounts: META_ADS_ACCOUNTS,
      setupInstructions: metaAccessToken ? null : {
        step1: 'Go to https://developers.facebook.com/tools/explorer/',
        step2: 'Generate token with ads_management, ads_read, business_management permissions',
        step3: 'Exchange to long-lived (60 days) token',
        step4: 'Paste token in Settings → Meta Ads Access Token'
      },
      demo: {
        campaigns: [
          { id: 'camp_1', name: 'Affiliate Promo Campaign', status: 'ACTIVE', spend: 1250000, impressions: 45000, clicks: 890, conversions: 45, ctr: 1.98, roas: 3.2 },
          { id: 'camp_2', name: 'Digital Product Launch', status: 'ACTIVE', spend: 850000, impressions: 32000, clicks: 560, conversions: 28, ctr: 1.75, roas: 4.1 },
          { id: 'camp_3', name: 'Brand Awareness', status: 'PAUSED', spend: 500000, impressions: 78000, clicks: 420, conversions: 12, ctr: 0.54, roas: 1.8 }
        ],
        daily: [
          { date: 'Mon', spend: 45000, impressions: 5200, clicks: 89, conversions: 8 },
          { date: 'Tue', spend: 52000, impressions: 6100, clicks: 105, conversions: 12 },
          { date: 'Wed', spend: 38000, impressions: 4500, clicks: 78, conversions: 6 },
          { date: 'Thu', spend: 65000, impressions: 7200, clicks: 125, conversions: 15 },
          { date: 'Fri', spend: 58000, impressions: 6800, clicks: 98, conversions: 11 },
          { date: 'Sat', spend: 72000, impressions: 8100, clicks: 145, conversions: 18 },
          { date: 'Sun', spend: 62000, impressions: 7000, clicks: 112, conversions: 14 }
        ]
      },
      summary: {
        totalSpend: 2600000,
        totalImpressions: 127000,
        totalConversions: 85,
        averageCTR: 1.42,
        averageROAS: 3.03,
        isDemo: true
      }
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' }
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

// Helper to fetch from Facebook Graph API
async function fetchFacebookData(endpoint: string, accessToken: string, fields: string, extraParams?: string): Promise<any> {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields
  })
  if (extraParams) {
    const [key, value] = extraParams.split('=')
    if (key && value) params.append(key, value)
  }
  
  const response = await fetch(`https://graph.facebook.com${endpoint}?${params}`, {
    next: { revalidate: 0 }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Facebook API error')
  }
  
  return response.json()
}
