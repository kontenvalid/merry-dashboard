import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || 'ck_81LPoF-vaCnWO8LTJ1nF'

// Meta Ads accounts
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' },
  { id: 'act_2061230484461298', currency: 'IDR', name: 'kontenval.id' }
]

// Get API key from database or env
async function getComposioKey(): Promise<string> {
  const record = await prisma.apiKey.findUnique({
    where: { userId_service: { userId: 'cmopvdcrn00004e1xbsct0hbq', service: 'composio' } }
  })
  
  if (record?.isActive && record.apiKey) {
    return Buffer.from(record.apiKey, 'base64').toString('utf8')
  }
  
  return COMPOSIO_API_KEY
}

// Call Composio Meta Ads API
async function callComposioApi(toolName: string, params: Record<string, any>) {
  const apiKey = await getComposioKey()
  
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

export async function GET() {
  try {
    console.log('Fetching Meta Ads via Composio...')
    
    // Step 1: Get ad accounts
    const accountsRes = await callComposioApi('METAADS_GET_AD_ACCOUNTS', {
      limit: 10,
      fields: 'id,account_id,name,currency,account_status'
    })

    console.log('Accounts response:', JSON.stringify(accountsRes).substring(0, 500))
    
    const accountsData = accountsRes?.results?.[0]?.data?.data || accountsRes?.data?.data || []
    
    const accounts = accountsData.map((acc: any) => ({
      id: acc.id || acc.account_id,
      accountId: acc.account_id,
      name: acc.name,
      currency: acc.currency,
      status: acc.account_status
    }))

    // If no accounts from API, use default accounts
    const finalAccounts = accounts.length > 0 ? accounts : META_ADS_ACCOUNTS

    // Step 2: Get insights for each account
    const campaigns: any[] = []
    let totalSpend = 0
    let totalClicks = 0
    let totalImpressions = 0

    for (const account of finalAccounts) {
      try {
        const insightsRes = await callComposioApi('METAADS_GET_INSIGHTS', {
          object_id: account.id,
          level: 'account',
          fields: 'impressions,clicks,spend,reach,cpc,cpm,campaign_name',
          date_preset: 'last_30d'
        })

        console.log(`Insights for ${account.id}:`, JSON.stringify(insightsRes).substring(0, 300))
        
        const insightsData = insightsRes?.results?.[0]?.data?.data || insightsRes?.data?.data || []
        
        for (const insight of insightsData) {
          const spend = parseFloat(insight.spend || '0')
          const clicks = parseInt(insight.clicks || '0')
          const impressions = parseInt(insight.impressions || '0')

          campaigns.push({
            accountId: account.id,
            accountName: account.name,
            currency: account.currency,
            name: insight.campaign_name || 'All Campaigns',
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
      } catch (e) {
        console.warn(`Failed to get insights for ${account.id}:`, e)
      }
    }

    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0

    return NextResponse.json({
      success: true,
      source: 'composio_metaads',
      timestamp: new Date().toISOString(),
      accounts: finalAccounts,
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
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}