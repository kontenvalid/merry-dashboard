import { NextResponse } from 'next/server'

export async function GET() {
  // Meta Ads data (currently disconnected - session expired)
  const data = {
    connected: false,
    error: 'Meta Ads session expired. Please reconnect in Composio dashboard.',
    lastChecked: '2026-05-03T09:52:00Z',
    accounts: [],
    // Demo data for UI development
    demo: {
      campaigns: [
        {
          id: 'camp_1',
          name: 'Affiliate Promo Campaign',
          status: 'ACTIVE',
          spend: 1250000,
          impressions: 45000,
          clicks: 890,
          conversions: 45,
          ctr: 1.98,
          cpc: 1404,
          roas: 3.2
        },
        {
          id: 'camp_2',
          name: 'Digital Product Launch',
          status: 'ACTIVE',
          spend: 850000,
          impressions: 32000,
          clicks: 560,
          conversions: 28,
          ctr: 1.75,
          cpc: 1518,
          roas: 4.1
        },
        {
          id: 'camp_3',
          name: 'Brand Awareness',
          status: 'PAUSED',
          spend: 500000,
          impressions: 78000,
          clicks: 420,
          conversions: 12,
          ctr: 0.54,
          cpc: 1190,
          roas: 1.8
        }
      ],
      daily: [
        { date: '2026-04-27', spend: 45000, impressions: 5200, conversions: 8 },
        { date: '2026-04-28', spend: 52000, impressions: 6100, conversions: 12 },
        { date: '2026-04-29', spend: 38000, impressions: 4500, conversions: 6 },
        { date: '2026-04-30', spend: 65000, impressions: 7200, conversions: 15 },
        { date: '2026-05-01', spend: 58000, impressions: 6800, conversions: 11 },
        { date: '2026-05-02', spend: 72000, impressions: 8100, conversions: 18 },
        { date: '2026-05-03', spend: 62000, impressions: 7000, conversions: 14 }
      ]
    },
    summary: {
      totalSpend: 2600000,
      totalImpressions: 127000,
      totalConversions: 85,
      averageCTR: 1.42,
      averageROAS: 3.03
    }
  }
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}
