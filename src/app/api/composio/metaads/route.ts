import { NextResponse } from 'next/server'
import { getApiKey } from '@/lib/api-key-store'

// Meta Ads accounts - use the account that the token has access to
const META_ADS_ACCOUNTS = [
  { id: 'act_2061230484461298', name: 'kontenval.id' }
]

// Meta Graph API base URL
const META_API_BASE = 'https://graph.facebook.com/v21.0'

// Currency symbols and formatting
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

// Format money based on currency
function formatMoney(amount: number, currency: string): string {
  const config = CURRENCY_CONFIG[currency] || { symbol: currency + ' ', locale: 'en-US', decimals: 2 };
  return `${config.symbol}${amount.toLocaleString(config.locale, { 
    minimumFractionDigits: config.decimals, 
    maximumFractionDigits: config.decimals 
  })}`;
}

export async function GET() {
  try {
    // Get Meta Graph API token from database
    const accessToken = await getApiKey('cmopvdcrn00004e1xbsct0hbq', 'meta_graph')

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'No Meta Graph API token found',
        message: 'Please configure Meta Graph API token in Settings',
        currency: null,
        currencySymbol: null
      }, { status: 400 })
    }

    const campaigns: any[] = []
    let totalSpend = 0
    let totalClicks = 0
    let totalImpressions = 0
    let detectedCurrency = 'IDR' // Default to IDR (Indonesia)

    // First, try to get currency from account details
    for (const account of META_ADS_ACCOUNTS) {
      try {
        // Get account details to detect currency
        const accountRes = await fetch(
          `${META_API_BASE}/${account.id}?fields=id,name,currency,account_currency&access_token=${accessToken}`
        )

        if (accountRes.ok) {
          const accountData = await accountRes.json()
          // Meta API returns currency in account_currency field
          if (accountData.account_currency) {
            detectedCurrency = accountData.account_currency
          } else if (accountData.currency) {
            detectedCurrency = accountData.currency
          }
        }
      } catch (e) {
        console.warn(`Failed to get account details for ${account.id}, using default currency`)
      }
    }

    // Now fetch insights with the detected currency
    for (const account of META_ADS_ACCOUNTS) {
      try {
        // Get account-level insights with currency info
        const insightsRes = await fetch(
          `${META_API_BASE}/${account.id}/insights?fields=impressions,clicks,spend,reach,cpc,cpm,account_currency&date_preset=last_30d&access_token=${accessToken}`
        )

        if (!insightsRes.ok) {
          const errorData = await insightsRes.json()
          console.warn(`Failed to fetch insights for ${account.id}:`, errorData)
          
          // Try with act_ prefix
          if (insightsRes.status === 400) {
            const altInsightsRes = await fetch(
              `${META_API_BASE}/${account.id.replace('act_', '')}/insights?fields=impressions,clicks,spend,reach,cpc,cpm,account_currency&date_preset=last_30d&access_token=${accessToken}`
            )
            if (altInsightsRes.ok) {
              const altData = await altInsightsRes.json()
              
              // Check for currency in response
              if (altData.data?.[0]?.account_currency) {
                detectedCurrency = altData.data[0].account_currency
              }
              
              if (altData.data?.length > 0) {
                for (const insight of altData.data) {
                  const spend = parseFloat(insight.spend || '0')
                  const clicks = parseInt(insight.clicks || '0')
                  const impressions = parseInt(insight.impressions || '0')

                  campaigns.push({
                    accountId: account.id,
                    accountName: account.name,
                    currency: detectedCurrency,
                    currencySymbol: CURRENCY_CONFIG[detectedCurrency]?.symbol || detectedCurrency,
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

        // Detect currency from insights data if not already set
        if (insightsData.data?.[0]?.account_currency && detectedCurrency === 'IDR') {
          detectedCurrency = insightsData.data[0].account_currency
        }

        if (insightsData.data?.length > 0) {
          for (const insight of insightsData.data) {
            const spend = parseFloat(insight.spend || '0')
            const clicks = parseInt(insight.clicks || '0')
            const impressions = parseInt(insight.impressions || '0')

            campaigns.push({
              accountId: account.id,
              accountName: account.name,
              currency: detectedCurrency,
              currencySymbol: CURRENCY_CONFIG[detectedCurrency]?.symbol || detectedCurrency,
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
            currency: detectedCurrency,
            currencySymbol: CURRENCY_CONFIG[detectedCurrency]?.symbol || detectedCurrency,
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

    const currencySymbol = CURRENCY_CONFIG[detectedCurrency]?.symbol || detectedCurrency

    return NextResponse.json({
      success: true,
      source: 'meta_graph_api',
      timestamp: new Date().toISOString(),
      currency: detectedCurrency,
      currencySymbol: currencySymbol,
      currencyConfig: CURRENCY_CONFIG[detectedCurrency] || { symbol: detectedCurrency, locale: 'en-US', decimals: 2 },
      accounts: META_ADS_ACCOUNTS.map(a => ({ ...a, currency: detectedCurrency, currencySymbol })),
      campaigns,
      summary: {
        totalSpend,
        totalCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
        totalClicks,
        totalImpressions,
        avgCPC,
        avgCPM
      },
      formatted: {
        totalSpend: formatMoney(totalSpend, detectedCurrency),
        avgCPC: formatMoney(avgCPC, detectedCurrency),
        avgCPM: formatMoney(avgCPM, detectedCurrency)
      }
    })
  } catch (error: any) {
    console.error('Meta Ads API error:', error)
    return NextResponse.json({
      success: false,
      source: 'error',
      error: error.message,
      currency: null,
      currencySymbol: null
    }, { status: 500 })
  }
}
