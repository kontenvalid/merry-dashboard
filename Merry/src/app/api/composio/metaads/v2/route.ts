import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiKey } from '@/lib/api-key-store'

// Meta Ads accounts
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' },
  { id: 'act_2061230484461298', currency: 'IDR', name: 'kontenval.id' }
]

// Call Composio Meta Ads API
async function callComposioApi(apiKey: string, toolName: string, params: Record<string, any>) {
  const response = await fetch('https://api.composio.io/v1/tools/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      toolName,
      input: params
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Composio API error ${response.status}: ${text}`)
  }

  return response.json()
}

// Currency configuration
const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string; decimals: number }> = {
  'IDR': { symbol: 'Rp', locale: 'id-ID', decimals: 0 },
  'USD': { symbol: '$', locale: 'en-US', decimals: 2 },
  'EUR': { symbol: '€', locale: 'de-DE', decimals: 2 },
  'GBP': { symbol: '£', locale: 'en-GB', decimals: 2 },
  'JPY': { symbol: '¥', locale: 'ja-JP', decimals: 0 },
  'MYR': { symbol: 'RM', locale: 'ms-MY', decimals: 2 },
  'SGD': { symbol: 'S$', locale: 'en-SG', decimals: 2 },
  'THB': { symbol: '฿', locale: 'th-TH', decimals: 2 },
};

export async function GET() {
  try {
    // Get session to identify user
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Please login first' 
      }, { status: 401 })
    }

    // Get user from database
    const { default: prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    const userId = user.id
    console.log('Meta Ads v2 for user:', user.email, '(ID:', userId, ')')

    // Get API keys for this user
    const composioKey = await getApiKey(userId, 'composio')
    const metaToken = await getApiKey(userId, 'meta_graph')

    if (!composioKey) {
      return NextResponse.json({
        success: false,
        error: 'Composio API key not found',
        message: 'Please configure Composio API key in Settings',
        currency: null
      }, { status: 400 })
    }

    if (!metaToken) {
      return NextResponse.json({
        success: false,
        error: 'Meta Graph API token not found',
        message: 'Please configure Meta Graph API token in Settings',
        currency: null
      }, { status: 400 })
    }

    // Fetch campaigns from each account
    const campaigns: any[] = []
    let totalSpend = 0
    let totalClicks = 0
    let totalImpressions = 0
    let detectedCurrency = 'IDR'

    const META_API_BASE = 'https://graph.facebook.com/v21.0'

    // Try to detect currency from account
    for (const account of META_ADS_ACCOUNTS) {
      try {
        const accountRes = await fetch(
          `${META_API_BASE}/${account.id}?fields=id,name,account_currency&access_token=${metaToken}`
        )
        
        if (accountRes.ok) {
          const accountData = await accountRes.json()
          if (accountData.account_currency) {
            detectedCurrency = accountData.account_currency
            break
          }
        }
      } catch (e) {
        console.warn(`Failed to get currency for ${account.id}`)
      }
    }

    // Fetch insights from each account
    for (const account of META_ADS_ACCOUNTS) {
      try {
        const insightsRes = await fetch(
          `${META_API_BASE}/${account.id}/insights?fields=impressions,clicks,spend,reach,cpc,cpm&date_preset=last_30d&access_token=${metaToken}`
        )

        if (insightsRes.ok) {
          const data = await insightsRes.json()
          
          // Check for currency in response
          if (data.data?.[0]?.account_currency) {
            detectedCurrency = data.data[0].account_currency
          }
          
          if (data.data?.length > 0) {
            for (const insight of data.data) {
              const spend = parseFloat(insight.spend || '0')
              const clicks = parseInt(insight.clicks || '0')
              const impressions = parseInt(insight.impressions || '0')
              
              campaigns.push({
                accountId: account.id,
                accountName: account.name,
                name: account.name + ' - Summary',
                status: spend > 0 ? 'ACTIVE' : 'INACTIVE',
                spend,
                impressions,
                clicks,
                reach: parseInt(insight.reach || '0'),
                cpc: parseFloat(insight.cpc || '0'),
                cpm: parseFloat(insight.cpm || '0'),
                currency: detectedCurrency
              })
              
              totalSpend += spend
              totalClicks += clicks
              totalImpressions += impressions
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch insights for ${account.id}:`, e)
      }
    }

    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0
    const avgCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
    const currencySymbol = CURRENCY_CONFIG[detectedCurrency]?.symbol || detectedCurrency

    return NextResponse.json({
      success: true,
      source: 'meta_graph_api',
      currency: detectedCurrency,
      currencySymbol,
      accounts: META_ADS_ACCOUNTS.map(a => ({ ...a, currency: detectedCurrency, currencySymbol })),
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
    console.error('Meta Ads v2 API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      currency: null
    }, { status: 500 })
  }
}