// Composio MCP Service
// Handles connection to Composio via MCP gateway and fetches social media data

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'

// Platform IDs
const FB_PAGE_ID = '1080250281836384'
const IG_USER_ID = '27556603287273697'
const YT_CHANNEL_ID = 'UCK2C25kK4E3PR6w0gPNCjaA'

export interface SocialMediaData {
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE'
  followers: number
  following: number
  posts: number
  engagement: number
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  views: number
}

export interface McpToolResult {
  success: boolean
  data?: any
  error?: string
}

// Call MCP endpoint with JSON-RPC 2.0
export async function callMcp(apiKey: string, method: string, params: any): Promise<McpToolResult> {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: method,
    params: params
  })

  try {
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
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }

    const text = await response.text()
    
    // Parse SSE format: "event: message\ndata: {...}"
    if (text.startsWith('event:')) {
      const jsonPart = text.split('\n').find(line => line.startsWith('data:'))
      if (jsonPart) {
        const data = JSON.parse(jsonPart.substring(5))
        if (data.result?.content?.[0]?.text) {
          try {
            return { success: true, data: JSON.parse(data.result.content[0].text) }
          } catch {
            return { success: true, data: data.result.content[0].text }
          }
        }
        if (data.result?.isError) {
          return { success: false, error: data.result.content?.[0]?.text || 'Tool error' }
        }
        return { success: true, data: data.result }
      }
    }
    
    return { success: true, data: JSON.parse(text) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Search for available tools
export async function searchTools(apiKey: string, query: string) {
  return callMcp(apiKey, 'tools/call', {
    name: 'COMPOSIO_SEARCH_TOOLS',
    arguments: { queries: [{ use_case: query }] },
    session: { generate_id: true },
    sync_response_to_workbench: false
  })
}

// Get available tools list
export async function listTools(apiKey: string) {
  return callMcp(apiKey, 'tools/list', {})
}

// Execute a specific Composio tool
export async function executeTool(apiKey: string, toolName: string, arguments_: any) {
  return callMcp(apiKey, 'tools/call', {
    name: toolName,
    arguments: arguments_
  })
}

// Fetch Facebook page data
export async function fetchFacebookData(apiKey: string): Promise<SocialMediaData | null> {
  // Try to search for Facebook tools first
  const searchResult = await searchTools(apiKey, 'facebook page followers')
  
  if (!searchResult.success || !searchResult.data?.tools) {
    console.warn('Facebook tools not found, using default data')
    return {
      platform: 'FACEBOOK',
      followers: 6,
      following: 0,
      posts: 0,
      engagement: 0,
      reach: 0,
      impressions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0
    }
  }

  // Get tool schemas for Facebook tools
  const toolSlugs = searchResult.data.tools
    .filter((t: any) => t.name.includes('FACEBOOK'))
    .map((t: any) => t.name)

  if (toolSlugs.length === 0) {
    // No Facebook tools available
    return null
  }

  // Execute Facebook tool (first available)
  const result = await executeTool(apiKey, toolSlugs[0], { page_id: FB_PAGE_ID })
  
  if (!result.success) {
    return null
  }

  // Parse result and return standardized data
  const data = result.data?.data || result.data
  
  return {
    platform: 'FACEBOOK',
    followers: data.followers_count || data.followers || 0,
    following: data.following_count || 0,
    posts: data.posts_count || data.media_count || 0,
    engagement: (data.likes || 0) + (data.comments || 0) + (data.shares || 0),
    reach: data.reach || 0,
    impressions: data.impressions || 0,
    likes: data.likes || 0,
    comments: data.comments || 0,
    shares: data.shares || 0,
    views: 0
  }
}

// Fetch Instagram profile data
export async function fetchInstagramData(apiKey: string): Promise<SocialMediaData | null> {
  // Search for Instagram tools
  const searchResult = await searchTools(apiKey, 'instagram followers profile')
  
  if (!searchResult.success || !searchResult.data?.tools) {
    console.warn('Instagram tools not found')
    return null
  }

  // Get Instagram tool slugs
  const toolSlugs = searchResult.data.tools
    .filter((t: any) => t.name.includes('INSTAGRAM') && t.name.includes('USER'))
    .map((t: any) => t.name)

  if (toolSlugs.length === 0) {
    console.warn('No Instagram user tools found')
    return null
  }

  // Execute Instagram tool
  const result = await executeTool(apiKey, toolSlugs[0], { ig_user_id: IG_USER_ID })
  
  if (!result.success) {
    console.warn('Instagram tool execution failed:', result.error)
    return null
  }

  // Parse result
  const data = result.data?.data || result.data
  
  return {
    platform: 'INSTAGRAM',
    followers: data.followers_count || data.followers || 0,
    following: data.following_count || 0,
    posts: data.media_count || 0,
    engagement: (data.likes || 0) + (data.comments || 0),
    reach: 0,
    impressions: 0,
    likes: data.likes || 0,
    comments: data.comments || 0,
    shares: 0,
    views: data.video_views || 0
  }
}

// Fetch YouTube channel data
export async function fetchYoutubeData(apiKey: string): Promise<SocialMediaData | null> {
  // Search for YouTube tools
  const searchResult = await searchTools(apiKey, 'youtube channel subscribers')
  
  if (!searchResult.success || !searchResult.data?.tools) {
    console.warn('YouTube tools not found')
    return null
  }

  // Get YouTube tool slugs
  const toolSlugs = searchResult.data.tools
    .filter((t: any) => t.name.includes('YOUTUBE') && t.name.includes('CHANNEL'))
    .map((t: any) => t.name)

  if (toolSlugs.length === 0) {
    console.warn('No YouTube channel tools found')
    return null
  }

  // Execute YouTube tool
  const result = await executeTool(apiKey, toolSlugs[0], { channel_id: YT_CHANNEL_ID })
  
  if (!result.success) {
    console.warn('YouTube tool execution failed:', result.error)
    return null
  }

  // Parse result
  const data = result.data?.data || result.data
  const stats = data.statistics || {}
  
  return {
    platform: 'YOUTUBE',
    followers: parseInt(stats.subscriberCount || '0'),
    following: 0,
    posts: parseInt(stats.videoCount || '0'),
    engagement: parseInt(stats.commentCount || '0'),
    reach: 0,
    impressions: 0,
    likes: 0,
    comments: parseInt(stats.commentCount || '0'),
    shares: 0,
    views: parseInt(stats.viewCount || '0')
  }
}

// Fetch all social media data
export async function fetchAllSocialData(apiKey: string): Promise<SocialMediaData[]> {
  const results: SocialMediaData[] = []

  // Fetch all in parallel
  const [fb, ig, yt] = await Promise.allSettled([
    fetchFacebookData(apiKey),
    fetchInstagramData(apiKey),
    fetchYoutubeData(apiKey)
  ])

  if (fb.status === 'fulfilled' && fb.value) {
    results.push(fb.value)
  }
  if (ig.status === 'fulfilled' && ig.value) {
    results.push(ig.value)
  }
  if (yt.status === 'fulfilled' && yt.value) {
    results.push(yt.value)
  }

  return results
}

// Fetch Google Drive files
export async function fetchGoogleDriveFiles(apiKey: string, folderId?: string) {
  const searchResult = await searchTools(apiKey, 'google drive files list')
  
  if (!searchResult.success || !searchResult.data?.tools) {
    return { success: false, files: [], error: 'Google Drive tools not found' }
  }

  const toolSlugs = searchResult.data.tools
    .filter((t: any) => t.name.includes('GOOGLEDRIVE'))
    .map((t: any) => t.name)

  if (toolSlugs.length === 0) {
    return { success: false, files: [], error: 'No Google Drive tools found' }
  }

  const result = await executeTool(apiKey, toolSlugs[0], {
    q: folderId ? `"${folderId}" in parents` : "trashed = false",
    fields: "files(id,name,mimeType,size,modifiedTime,webViewLink)",
    orderBy: "modifiedTime desc",
    pageSize: 100
  })

  if (!result.success) {
    return { success: false, files: [], error: result.error }
  }

  const files = result.data?.files || result.data || []
  return { success: true, files }
}

// Test MCP connection
export async function testMcpConnection(apiKey: string) {
  const result = await listTools(apiKey)
  return {
    success: result.success,
    toolsCount: result.data?.tools?.length || 0,
    error: result.error
  }
}