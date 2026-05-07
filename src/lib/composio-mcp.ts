// Composio MCP Service v3
// Uses COMPOSIO_MULTI_EXECUTE_TOOL to execute social media tools

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
  watchTime: number
}

export interface McpToolResult {
  success: boolean
  data?: any
  error?: string
}

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  modifiedTime: string
  webViewLink: string
}

// Call MCP endpoint with JSON-RPC 2.0
async function callMcp(apiKey: string, method: string, params: any): Promise<McpToolResult> {
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
        return { success: true, data }
      }
    }
    
    return { success: true, data: JSON.parse(text) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Parse text content from MCP response
function parseTextContent(result: any): any {
  if (result?.result?.content?.[0]?.text) {
    try {
      return JSON.parse(result.result.content[0].text)
    } catch {
      return result.result.content[0].text
    }
  }
  return result?.result || result
}

// Execute multiple tools using COMPOSIO_MULTI_EXECUTE_TOOL
async function executeMultiTools(apiKey: string, tools: any[], step: string, thought: string): Promise<any[]> {
  const result = await callMcp(apiKey, 'tools/call', {
    name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
    arguments: {
      current_step: step,
      thought: thought,
      tools: tools,
      sync_response_to_workbench: false
    }
  })

  if (!result.success) {
    throw new Error(result.error || 'Multi-execute failed')
  }

  const parsed = parseTextContent(result)
  return parsed?.data?.results?.[0]?.response?.data || []
}

// =======================
// FACEBOOK
// =======================

async function fetchFacebookPageInfo(apiKey: string) {
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'FACEBOOK_GET_PAGE_DETAILS',
        arguments: { page_id: FB_PAGE_ID }
      }
    ], 'FETCHING_FACEBOOK_PAGE', 'Get Facebook page details including followers count')
    
    return results?.[0]?.data || null
  } catch (e) {
    console.warn('FACEBOOK_GET_PAGE_DETAILS failed:', e)
    return null
  }
}

async function fetchFacebookPosts(apiKey: string, limit = 10) {
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'FACEBOOK_GET_PAGE_POSTS',
        arguments: {
          page_id: FB_PAGE_ID,
          limit: limit,
          fields: 'id,message,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true)'
        }
      }
    ], 'FETCHING_FACEBOOK_POSTS', 'Get recent Facebook page posts')
    
    return results?.[0]?.data || []
  } catch (e) {
    console.warn('FACEBOOK_GET_PAGE_POSTS failed:', e)
    return []
  }
}

async function fetchFacebookPageInsights(apiKey: string) {
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'FACEBOOK_GET_PAGE_INSIGHTS',
        arguments: {
          page_id: FB_PAGE_ID,
          metrics: 'page_impressions,page_reach,page_post_engagements,page_fan_count,page_views_total'
        }
      }
    ], 'FETCHING_FACEBOOK_INSIGHTS', 'Get Facebook page insights and metrics')
    
    return results?.[0]?.data || null
  } catch (e) {
    console.warn('FACEBOOK_GET_PAGE_INSIGHTS failed:', e)
    return null
  }
}

async function fetchFacebookManagedPages(apiKey: string) {
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'FACEBOOK_LIST_MANAGED_PAGES',
        arguments: {}
      }
    ], 'FETCHING_FACEBOOK_PAGES', 'List all Facebook pages managed by the user')
    
    return results?.[0]?.data || []
  } catch (e) {
    console.warn('FACEBOOK_LIST_MANAGED_PAGES failed:', e)
    return []
  }
}

// =======================
// INSTAGRAM
// =======================

async function fetchInstagramUserInfo(apiKey: string) {
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'INSTAGRAM_GET_USER_INFO',
        arguments: { ig_user_id: IG_USER_ID }
      }
    ], 'FETCHING_INSTAGRAM_USER', 'Get Instagram user profile info')
    
    return results?.[0]?.data || null
  } catch (e) {
    console.warn('INSTAGRAM_GET_USER_INFO failed:', e)
    return null
  }
}

async function fetchInstagramMedia(apiKey: string, limit = 10) {
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'INSTAGRAM_GET_IG_USER_MEDIA',
        arguments: { ig_user_id: IG_USER_ID, limit: limit }
      }
    ], 'FETCHING_INSTAGRAM_MEDIA', 'Get Instagram user media posts')
    
    return results?.[0]?.data || []
  } catch (e) {
    console.warn('INSTAGRAM_GET_IG_USER_MEDIA failed:', e)
    return []
  }
}

async function fetchInstagramUserInsights(apiKey: string) {
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'INSTAGRAM_GET_USER_INSIGHTS',
        arguments: { ig_user_id: IG_USER_ID }
      }
    ], 'FETCHING_INSTAGRAM_INSIGHTS', 'Get Instagram user insights')
    
    return results?.[0]?.data || null
  } catch (e) {
    console.warn('INSTAGRAM_GET_USER_INSIGHTS failed:', e)
    return null
  }
}

// =======================
// YOUTUBE
// =======================

async function fetchYoutubeChannelStats(apiKey: string) {
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'YOUTUBE_GET_CHANNEL_STATISTICS',
        arguments: { channel_id: YT_CHANNEL_ID }
      }
    ], 'FETCHING_YOUTUBE_STATS', 'Get YouTube channel statistics')
    
    return results?.[0]?.data || null
  } catch (e) {
    console.warn('YOUTUBE_GET_CHANNEL_STATISTICS failed:', e)
    return null
  }
}

async function fetchYoutubeChannelDetails(apiKey: string) {
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'YOUTUBE_GET_CHANNEL_DETAILS',
        arguments: { channel_id: YT_CHANNEL_ID }
      }
    ], 'FETCHING_YOUTUBE_DETAILS', 'Get YouTube channel details')
    
    return results?.[0]?.data || null
  } catch (e) {
    console.warn('YOUTUBE_GET_CHANNEL_DETAILS failed:', e)
    return null
  }
}

async function fetchYoutubeVideos(apiKey: string, maxResults = 10) {
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'YOUTUBE_LIST_CHANNEL_VIDEOS',
        arguments: { channel_id: YT_CHANNEL_ID, max_results: maxResults }
      }
    ], 'FETCHING_YOUTUBE_VIDEOS', 'Get recent YouTube channel videos')
    
    return results?.[0]?.data || []
  } catch (e) {
    console.warn('YOUTUBE_LIST_CHANNEL_VIDEOS failed:', e)
    return []
  }
}

// =======================
// Fetch All Data
// =======================

export async function fetchAllFacebookData(apiKey: string): Promise<SocialMediaData | null> {
  console.log('📘 Fetching Facebook data...')
  
  try {
    const [pageInfo, posts, insights] = await Promise.all([
      fetchFacebookPageInfo(apiKey),
      fetchFacebookPosts(apiKey, 20),
      fetchFacebookPageInsights(apiKey)
    ])

    console.log('FB Page Info:', pageInfo)
    console.log('FB Posts count:', Array.isArray(posts) ? posts.length : 'N/A')
    console.log('FB Insights:', insights)

    // Parse page info
    let followers = 0, postsCount = 0
    if (pageInfo) {
      followers = pageInfo.followers_count || pageInfo.followers || 0
      postsCount = pageInfo.posts_count || 0
    }

    // Parse posts for engagement
    let likes = 0, comments = 0, shares = 0, reach = 0, impressions = 0
    const postsArray = Array.isArray(posts) ? posts : []
    
    for (const post of postsArray) {
      likes += post.reactions?.summary?.total_count || 0
      comments += post.comments?.summary?.total_count || 0
      shares += post.shares?.count || 0
    }

    // Parse insights
    if (insights) {
      if (Array.isArray(insights)) {
        for (const item of insights) {
          if (item.name === 'page_impressions') impressions = item.values?.[0]?.value || 0
          if (item.name === 'page_reach') reach = item.values?.[0]?.value || 0
        }
      } else {
        impressions = insights.page_impressions || insights.impressions || 0
        reach = insights.page_reach || insights.reach || 0
      }
    }

    console.log('📘 Facebook parsed:', { followers, postsCount, likes, comments, shares, reach, impressions })

    return {
      platform: 'FACEBOOK',
      followers,
      following: 0,
      posts: postsCount,
      engagement: likes + comments + shares,
      reach,
      impressions,
      likes,
      comments,
      shares,
      views: 0,
      watchTime: 0
    }
  } catch (error: any) {
    console.error('Facebook fetch error:', error)
    return null
  }
}

export async function fetchAllInstagramData(apiKey: string): Promise<SocialMediaData | null> {
  console.log('📷 Fetching Instagram data...')
  
  try {
    const [userInfo, media, insights] = await Promise.all([
      fetchInstagramUserInfo(apiKey),
      fetchInstagramMedia(apiKey, 20),
      fetchInstagramUserInsights(apiKey)
    ])

    console.log('IG User Info:', userInfo)
    console.log('IG Media count:', Array.isArray(media) ? media.length : 'N/A')
    console.log('IG Insights:', insights)

    // Parse user info
    let followers = 0, following = 0, postsCount = 0
    if (userInfo) {
      followers = userInfo.followers_count || userInfo.followers || 0
      following = userInfo.follows_count || userInfo.following || 0
      postsCount = userInfo.media_count || userInfo.posts || 0
    }

    // Parse media for engagement
    let likes = 0, comments = 0, shares = 0, views = 0, reach = 0, impressions = 0
    const mediaArray = Array.isArray(media) ? media : []
    
    for (const item of mediaArray) {
      likes += item.like_count || 0
      comments += item.comments_count || 0
      shares += item.share_count || 0
      views += item.video_view_count || item.views || 0
    }

    // Parse insights
    if (insights) {
      if (Array.isArray(insights)) {
        for (const item of insights) {
          if (item.name === 'impressions') impressions += item.values?.[0]?.value || 0
          if (item.name === 'reach') reach += item.values?.[0]?.value || 0
        }
      } else {
        impressions = insights.impressions || 0
        reach = insights.reach || 0
        views = insights.views || views
      }
    }

    console.log('📷 Instagram parsed:', { followers, following, postsCount, likes, comments, views, reach, impressions })

    return {
      platform: 'INSTAGRAM',
      followers,
      following,
      posts: postsCount,
      engagement: likes + comments + shares,
      reach,
      impressions,
      likes,
      comments,
      shares,
      views,
      watchTime: 0
    }
  } catch (error: any) {
    console.error('Instagram fetch error:', error)
    return null
  }
}

export async function fetchAllYoutubeData(apiKey: string): Promise<SocialMediaData | null> {
  console.log('📺 Fetching YouTube data...')
  
  try {
    const [stats, details, videos] = await Promise.all([
      fetchYoutubeChannelStats(apiKey),
      fetchYoutubeChannelDetails(apiKey),
      fetchYoutubeVideos(apiKey, 20)
    ])

    console.log('YT Stats:', stats)
    console.log('YT Details:', details ? 'present' : 'null')
    console.log('YT Videos count:', Array.isArray(videos) ? videos.length : 'N/A')

    // Parse channel statistics
    let subscribers = 0, views = 0, postsCount = 0, commentsCount = 0
    let likes = 0, watchTime = 0
    
    if (stats) {
      const statistics = stats.statistics || stats
      subscribers = parseInt(statistics.subscriberCount || '0') || 0
      views = parseInt(statistics.viewCount || '0') || 0
      postsCount = parseInt(statistics.videoCount || '0') || 0
      commentsCount = parseInt(statistics.commentCount || '0') || 0
    }

    // Parse videos for engagement
    const videosArray = Array.isArray(videos) ? videos : []
    
    for (const video of videosArray) {
      const vStats = video.statistics || {}
      likes += parseInt(vStats.likeCount || '0') || 0
      commentsCount += parseInt(vStats.commentCount || '0') || 0
      watchTime += video.approximate_watch_time_estimate || video.watch_time || 0
    }

    console.log('📺 YouTube parsed:', { subscribers, views, postsCount, likes, commentsCount, watchTime })

    return {
      platform: 'YOUTUBE',
      followers: subscribers,
      following: 0,
      posts: postsCount,
      engagement: likes + commentsCount,
      reach: views,
      impressions: 0,
      likes,
      comments: commentsCount,
      shares: 0,
      views,
      watchTime
    }
  } catch (error: any) {
    console.error('YouTube fetch error:', error)
    return null
  }
}

// Fetch all social media data
export async function fetchAllSocialData(apiKey: string): Promise<SocialMediaData[]> {
  console.log('\n=== Fetching all social media data ===\n')

  const [fb, ig, yt] = await Promise.allSettled([
    fetchAllFacebookData(apiKey),
    fetchAllInstagramData(apiKey),
    fetchAllYoutubeData(apiKey)
  ])

  const results: SocialMediaData[] = []

  if (fb.status === 'fulfilled' && fb.value) {
    console.log('✅ Facebook success:', fb.value)
    results.push(fb.value)
  } else {
    console.log('❌ Facebook failed:', fb.status, fb.reason?.message)
  }
  
  if (ig.status === 'fulfilled' && ig.value) {
    console.log('✅ Instagram success:', ig.value)
    results.push(ig.value)
  } else {
    console.log('❌ Instagram failed:', ig.status, ig.reason?.message)
  }
  
  if (yt.status === 'fulfilled' && yt.value) {
    console.log('✅ YouTube success:', yt.value)
    results.push(yt.value)
  } else {
    console.log('❌ YouTube failed:', yt.status, yt.reason?.message)
  }

  console.log(`\n=== Total: ${results.length} platforms fetched ===\n`)
  return results
}

// Test MCP connection
export async function testMcpConnection(apiKey: string) {
  const result = await callMcp(apiKey, 'tools/list', {})
  return {
    success: result.success,
    toolsCount: result.data?.result?.tools?.length || 0,
    error: result.error
  }
}

// Get connection status
export async function getConnectionStatus(apiKey: string) {
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'COMPOSIO_SEARCH_TOOLS',
        arguments: { queries: [{ use_case: 'facebook instagram youtube' }] }
      }
    ], 'CHECKING_STATUS', 'Check social media connection status')
    
    const parsed = results?.[0]?.data
    return parsed?.data?.toolkit_connection_statuses || []
  } catch (e) {
    console.warn('Connection status check failed:', e)
    return []
  }
}

// Fetch Google Drive files
export async function fetchGoogleDriveFiles(apiKey: string): Promise<{ success: boolean; files: GoogleDriveFile[]; error?: string }> {
  console.log('📁 Fetching Google Drive files...')
  
  try {
    const results = await executeMultiTools(apiKey, [
      {
        tool_slug: 'GOOGLEDRIVE_LIST_DRIVE_FILES',
        arguments: { 
          page_size: 50,
          order_by: 'modified_time desc'
        }
      }
    ], 'FETCHING_GDRIVE', 'List Google Drive files')
    
    const filesData = results?.[0]?.data?.files || results?.[0]?.data || []
    
    const files: GoogleDriveFile[] = filesData.map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size || 0,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink
    }))
    
    console.log(`📁 Found ${files.length} Google Drive files`)
    return { success: true, files }
  } catch (e: any) {
    console.warn('Google Drive fetch failed:', e)
    return { success: false, files: [], error: e.message }
  }
}