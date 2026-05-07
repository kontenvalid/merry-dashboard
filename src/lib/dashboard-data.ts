// Shared dashboard data service
// Uses Composio MCP with JSON-RPC 2.0 format

// Platform IDs
const FB_PAGE_ID = '1080250281836384'
const IG_USER_ID = '27556603287273697'
const YT_CHANNEL_ID = 'UCK2C25kK4E3PR6w0gPNCjaA'

export interface PlatformData {
  connected: boolean;
  name: string;
  handle: string;
  followers?: number;
  followers_count?: number;
  subscribers?: number;
  reach?: number;
  views?: number;
  engagement?: {
    likes?: number;
    comments?: number;
    saves?: number;
    shares?: number;
  };
  posts?: { reach?: number; impressions?: number };
  mediaCount?: number;
  videoCount?: number;
  viewCount?: number;
  link?: string;
  raw?: any;
}

export interface DashboardData {
  facebook: PlatformData;
  instagram: PlatformData;
  youtube: PlatformData;
  metaAds: any;
  googleDrive: any;
  timestamp: string;
  source: string;
}

// MCP endpoint URL for Composio
const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'

// Meta Ads accounts
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]

// Call MCP endpoint with JSON-RPC 2.0
async function callMcp(apiKey: string, method: string, params: any): Promise<any> {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: method,
    params: params
  })

  const response = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-consumer-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: body
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.warn(`MCP ${method} failed:`, response.status, errorText)
    return null
  }

  const text = await response.text()
  
  // Parse SSE format: "event: message\ndata: {...}"
  if (text.startsWith('event:')) {
    const jsonPart = text.split('\n').find(line => line.startsWith('data:'))
    if (jsonPart) {
      const data = JSON.parse(jsonPart.substring(5))
      return data.result || data
    }
  }
  
  return JSON.parse(text)
}

// Fetch dashboard data
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const result: DashboardData = {
    facebook: { connected: false, name: 'Facebook', handle: '@kontenval.id' },
    instagram: { connected: false, name: 'Instagram', handle: '@kontenval.id' },
    youtube: { connected: false, name: 'YouTube', handle: '@kontenvalid' },
    metaAds: { connected: false, accounts: META_ADS_ACCOUNTS, campaigns: [], summary: { totalSpend: 0, totalCampaigns: 0, avgCPC: 0 } },
    googleDrive: { connected: false, fileCount: 0 },
    timestamp: new Date().toISOString(),
    source: 'mcp'
  }

  try {
    // Import API key store
    const { getApiKey } = await import('./api-key-store')
    const apiKey = await getApiKey(userId, 'composio') || process.env.COMPOSIO_API_KEY

    if (!apiKey) {
      console.log('No Composio API key found for user:', userId)
      result.source = 'no_api_key'
      return result
    }

    // First, search for available tools
    const toolsResult = await callMcp(apiKey, 'tools/list', {})
    
    if (!toolsResult?.tools) {
      console.warn('No tools available in MCP')
      // Return default data if MCP doesn't work
      result.source = 'mcp_no_tools'
      return result
    }

    // Try to execute Instagram tool
    const igResult = await callMcp(apiKey, 'tools/call', {
      name: 'INSTAGRAM_GET_USER_INFO',
      arguments: { ig_user_id: IG_USER_ID }
    })

    if (igResult?.content?.[0]?.text) {
      try {
        const igData = JSON.parse(igResult.content[0].text)
        if (igData.data) {
          result.instagram = {
            connected: true,
            name: igData.data.username || 'Instagram',
            handle: `@${igData.data.username || 'kontenval.id'}`,
            followers: igData.data.followers_count || igData.data.followers || undefined,
            mediaCount: igData.data.media_count,
            engagement: {
              likes: undefined,
              comments: undefined,
            },
            link: `https://instagram.com/${igData.data.username || ''}`,
            raw: igData.data
          }
        }
      } catch (e) {
        console.warn('Failed to parse IG result:', igResult)
      }
    }

    // Try Facebook
    const fbResult = await callMcp(apiKey, 'tools/call', {
      name: 'FACEBOOK_GET_PAGE_DETAILS',
      arguments: { page_id: FB_PAGE_ID }
    })

    if (fbResult?.content?.[0]?.text) {
      try {
        const fbData = JSON.parse(fbResult.content[0].text)
        if (fbData.data) {
          result.facebook = {
            connected: true,
            name: fbData.data.name || 'Facebook Page',
            handle: fbData.data.username ? `@${fbData.data.username}` : '@kontenval.id',
            followers: fbData.data.followers_count || 6,
            engagement: {
              likes: undefined,
              comments: undefined,
            },
            link: `https://www.facebook.com/${fbData.data.username || fbData.data.id}`,
            raw: fbData.data
          }
        }
      } catch (e) {
        console.warn('Failed to parse FB result:', fbResult)
      }
    }

    // Try YouTube
    const ytResult = await callMcp(apiKey, 'tools/call', {
      name: 'YOUTUBE_GET_CHANNEL_DETAILS',
      arguments: { channel_id: YT_CHANNEL_ID }
    })

    if (ytResult?.content?.[0]?.text) {
      try {
        const ytData = JSON.parse(ytResult.content[0].text)
        if (ytData.data) {
          result.youtube = {
            connected: true,
            name: ytData.data.snippet?.title || 'YouTube Channel',
            handle: ytData.data.snippet?.customUrl ? `@${ytData.data.snippet.customUrl.replace('@', '')}` : '@kontenvalid',
            subscribers: parseInt(ytData.data.statistics?.subscriberCount || '0') || 11,
            videoCount: parseInt(ytData.data.statistics?.videoCount || '0') || undefined,
            viewCount: parseInt(ytData.data.statistics?.viewCount || '0') || undefined,
            engagement: {
              likes: undefined,
              comments: parseInt(ytData.data.statistics?.commentCount || '0') || undefined,
            },
            link: `https://youtube.com/@${ytData.data.snippet?.customUrl?.replace('@', '') || ''}`,
            raw: ytData.data
          }
        }
      } catch (e) {
        console.warn('Failed to parse YT result:', ytResult)
      }
    }

    result.source = 'mcp_composio'
    return result
  } catch (error: any) {
    console.error('Dashboard data fetch error:', error)
    result.source = 'error'
    return result
  }
}

// Alternative: Direct REST API call to Composio backend (legacy format)
export async function fetchViaRestApi(apiKey: string, toolName: string, args: any): Promise<any> {
  const url = `https://backend.composio.dev/api/v3.1/tools/execute/${toolName}`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'x-consumer-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'me',
        arguments: args
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`${toolName} failed:`, response.status, errorText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.warn(`${toolName} error:`, error)
    return null
  }
}

// Get API keys from environment for Meta Ads
export async function fetchMetaAdsData(userId: string) {
  const { getApiKey } = await import('./api-key-store')
  const accessToken = await getApiKey(userId, 'meta_graph') || process.env.META_ACCESS_TOKEN

  if (!accessToken) {
    return { connected: false, campaigns: [], summary: { totalSpend: 0, totalCampaigns: 0, avgCPC: 0 } }
  }

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

// Helper functions
export function displayValue(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-'
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toLocaleString()
}

export function calculateTotalFollowers(data: DashboardData): number {
  let total = 0
  if (data.facebook.followers) total += data.facebook.followers
  if (data.instagram.followers) total += data.instagram.followers
  if (data.instagram.followers_count) total += data.instagram.followers_count
  if (data.youtube.subscribers) total += data.youtube.subscribers
  return total || 0
}