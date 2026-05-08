/**
 * Meta Graph API Data Fetcher
 * Uses all 12 available permissions to gather comprehensive data
 * 
 * Permissions used:
 * - pages_show_list, pages_read_engagement, pages_manage_ads
 * - ads_management, ads_read, business_management
 * - catalog_management, threads_business_basic
 */

import prisma from '@/lib/prisma'

const META_API_BASE = 'https://graph.facebook.com/v21.0'

interface MetaAccount {
  id: string
  name: string
  currency: string
}

const META_ADS_ACCOUNTS: MetaAccount[] = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]

// Token storage - in production, get from DB
let metaAccessToken = ''

export async function setMetaToken(token: string) {
  metaAccessToken = token
}

export async function getMetaToken(): Promise<string> {
  if (metaAccessToken) return metaAccessToken
  
  // Try to get from database - search by service, any user
  const apiKey = await prisma.apiKey.findFirst({
    where: { service: 'meta_graph', isActive: true }
  })
  
  if (apiKey?.apiKey) {
    metaAccessToken = apiKey.apiKey
    return metaAccessToken
  }
  
  throw new Error('No Meta Access Token configured')
}

// ============ PAGE DATA (pages_show_list + pages_read_engagement) ============

export async function fetchPagesList(): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/me/accounts?fields=id,name,fan_count,followers_count,posts_count,about,cover,single_line_address&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch pages: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

export async function fetchPageInsights(pageId: string, days: number = 30): Promise<any> {
  const token = await getMetaToken()
  const since = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60)
  const until = Math.floor(Date.now() / 1000)
  
  const response = await fetch(
    `${META_API_BASE}/${pageId}/insights?metric=page_impressions_unique,page_impressions,page_post_engagements,page_views_total,page_follows,page_fans,page_demographics_locale&since=${since}&until=${until}&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch page insights: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

export async function fetchPagePosts(pageId: string, limit: number = 25): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/${pageId}/posts?fields=id,message,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_clicks)&limit=${limit}&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch page posts: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

// ============ ADS DATA (ads_read + ads_management) ============

export async function fetchAdsAccounts(): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/me/adaccounts?fields=id,name,account_status,currency,amount_spent,daily_budget&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ad accounts: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

export async function fetchCampaigns(accountId: string): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/${accountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,start_time,stop_time&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch campaigns: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

export async function fetchCampaignInsights(accountId: string, days: number = 30): Promise<any> {
  const token = await getMetaToken()
  const since = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60)
  const until = Math.floor(Date.now() / 1000)
  
  const response = await fetch(
    `${META_API_BASE}/${accountId}/insights?fields=spend,impressions,clicks,cpc,cpm,actions,action_values&time_range={"since":"${since}","until":"${until}"}&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch campaign insights: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

export async function fetchAdSets(accountId: string): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/${accountId}/adsets?fields=id,name,status,daily_budget,targeting,optimization_goal&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ad sets: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

export async function fetchAds(campaignId: string): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/${campaignId}/ads?fields=id,name,status,creative,adset_id&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ads: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

// ============ CATALOG DATA (catalog_management) ============

export async function fetchCatalogs(): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/me/businesses?fields=owned_product_catalogs{id,name,product_count,vertical}&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch catalogs: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

export async function fetchCatalogProducts(catalogId: string, limit: number = 50): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/${catalogId}/products?fields=id,name,description,price,availability,image_url,url&limit=${limit}&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch catalog products: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

// ============ THREADS DATA (threads_business_basic) ============

export async function fetchThreadsProfile(InstagramBusinessAccountId: string): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/${InstagramBusinessAccountId}/threads?fields=id,threads_metrics,username,name&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch threads profile: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

export async function fetchThreadsPosts(InstagramBusinessAccountId: string, limit: number = 25): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/${InstagramBusinessAccountId}/threads?fields=id,text,timestamp,like_count,replies_count,repost_count,permalink&limit=${limit}&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch threads posts: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

// ============ BUSINESS DATA (business_management) ============

export async function fetchBusinessInfo(): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/me?fields=id,name,Businesses{id,name,link,primary_page}&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch business info: ${response.status}`)
  }
  
  const data = await response.json()
  return data
}

export async function fetchBusinessUsers(): Promise<any> {
  const token = await getMetaToken()
  
  // Get business ID first
  const meRes = await fetch(`${META_API_BASE}/me?fields=id&access_token=${token}`)
  const meData = await meRes.json()
  
  if (!meData.id) {
    throw new Error('No business ID found')
  }
  
  const response = await fetch(
    `${META_API_BASE}/${meData.id}/users?fields=id,email,role,name&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch business users: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

// ============ INSTAGRAM DATA ============

export async function fetchInstagramProfile(InstagramBusinessAccountId: string): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/${InstagramBusinessAccountId}?fields=id,name,username,followers_count,follows_count,media_count,biography,website,profile_picture_url&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Instagram profile: ${response.status}`)
  }
  
  const data = await response.json()
  return data
}

export async function fetchInstagramMedia(InstagramBusinessAccountId: string, limit: number = 25): Promise<any> {
  const token = await getMetaToken()
  
  const response = await fetch(
    `${META_API_BASE}/${InstagramBusinessAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,views,reach,saved&limit=${limit}&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Instagram media: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

export async function fetchInstagramInsights(InstagramBusinessAccountId: string, days: number = 30): Promise<any> {
  const token = await getMetaToken()
  const since = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60)
  const until = Math.floor(Date.now() / 1000)
  
  const response = await fetch(
    `${META_API_BASE}/${InstagramBusinessAccountId}/insights?metric=impressions,reach,profile_views,follower_count,online_followers&period=day&since=${since}&until=${until}&access_token=${token}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Instagram insights: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

// ============ STORE TO DATABASE ============

export async function storePageAnalytics(pageId: string, pageName: string, insights: any[], posts: any[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Calculate aggregated metrics
  let totalReach = 0, totalImpressions = 0, totalEngagement = 0, totalViews = 0
  
  for (const insight of insights) {
    if (insight.name === 'page_impressions_unique') totalReach = insight.values.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : b.value || 0), 0)
    if (insight.name === 'page_impressions') totalImpressions = insight.values.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : b.value || 0), 0)
    if (insight.name === 'page_post_engagements') totalEngagement = insight.values.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : b.value || 0), 0)
    if (insight.name === 'page_views_total') totalViews = insight.values.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : b.value || 0), 0)
  }
  
  let totalLikes = 0, totalComments = 0, totalShares = 0
  for (const post of posts) {
    totalLikes += post.likes?.summary?.total_count || 0
    totalComments += post.comments?.summary?.total_count || 0
    totalShares += post.shares?.count || 0
  }
  
  // Get current follower count from latest insight
  let followers = 0
  const fanInsight = insights.find(i => i.name === 'page_fans')
  if (fanInsight?.values?.length) {
    const latest = fanInsight.values[fanInsight.values.length - 1]
    followers = typeof latest === 'number' ? latest : latest?.value || 0
  }
  
  await prisma.analytics.upsert({
    where: { platform_date: { platform: 'FACEBOOK', date: today } },
    update: { followers, posts: posts.length, likes: totalLikes, comments: totalComments, shares: totalShares, engagement: totalLikes + totalComments + totalShares, reach: totalReach, impressions: totalImpressions },
    create: { platform: 'FACEBOOK', date: today, followers, posts: posts.length, likes: totalLikes, comments: totalComments, shares: totalShares, engagement: totalLikes + totalComments + totalShares, reach: totalReach, impressions: totalImpressions }
  })
}

export async function storeAdPerformance(accountId: string, accountName: string, insights: any[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let spend = 0, impressions = 0, clicks = 0, conversions = 0
  let cpc = null, cpm = null, roas = null
  
  for (const insight of insights) {
    if (insight.name === 'spend') spend = insight.values.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : b.value || 0), 0)
    if (insight.name === 'impressions') impressions = insight.values.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : b.value || 0), 0)
    if (insight.name === 'clicks') clicks = insight.values.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : b.value || 0), 0)
    if (insight.name === 'actions') conversions = insight.values.reduce((a: number, b: any) => a + (typeof b === 'number' ? b : b.value || 0), 0)
  }
  
  if (clicks > 0) cpc = spend / clicks
  if (impressions > 0) cpm = (spend / impressions) * 1000
  
  await prisma.adPerformance.upsert({
    where: { accountId_date: { accountId, date: today } },
    update: { spend, impressions, clicks, cpc, cpm, roas, conversions },
    create: { accountId, campaignName: accountName, date: today, spend, impressions, clicks, cpc, cpm, roas, conversions }
  })
}

// ============ MAIN FETCH FUNCTION ============

export interface FetchResult {
  success: boolean
  timestamp: string
  durationMs: number
  data: {
    pages: any[]
    campaigns: any[]
    catalogs: any[]
    threads: any[]
    errors: string[]
  }
}

export async function fetchAllData(): Promise<FetchResult> {
  const startTime = Date.now()
  const result: FetchResult = {
    success: false,
    timestamp: new Date().toISOString(),
    durationMs: 0,
    data: { pages: [], campaigns: [], catalogs: [], threads: [], errors: [] }
  }
  
  try {
    const token = await getMetaToken()
    
    // 1. Fetch Pages (pages_show_list + pages_read_engagement)
    console.log('📱 Fetching Facebook Pages...')
    try {
      const pages = await fetchPagesList()
      result.data.pages = pages
      
      for (const page of pages) {
        const insights = await fetchPageInsights(page.id, 30)
        const posts = await fetchPagePosts(page.id, 25)
        await storePageAnalytics(page.id, page.name, insights, posts)
      }
    } catch (e: any) {
      result.data.errors.push(`Pages: ${e.message}`)
    }
    
    // 2. Fetch Instagram Profile & Media
    console.log('📸 Fetching Instagram...')
    const IG_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '27556603287273697'
    try {
      const igProfile = await fetchInstagramProfile(IG_ACCOUNT_ID)
      console.log('Instagram Profile:', igProfile.username, igProfile.followers_count, 'followers')
      
      const igMedia = await fetchInstagramMedia(IG_ACCOUNT_ID, 25)
      console.log('Instagram Media:', igMedia.length, 'posts')
      
      // Store IG analytics
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let totalLikes = 0, totalComments = 0, totalViews = 0
      for (const m of igMedia) {
        totalLikes += m.like_count || 0
        totalComments += m.comments_count || 0
        totalViews += m.views || 0
      }
      
      await prisma.analytics.upsert({
        where: { platform_date: { platform: 'INSTAGRAM', date: today } },
        update: { followers: igProfile.followers_count || 0, posts: igMedia.length, likes: totalLikes, comments: totalComments, engagement: totalLikes + totalComments, views: totalViews, reach: igMedia.length * 100 },
        create: { platform: 'INSTAGRAM', date: today, followers: igProfile.followers_count || 0, posts: igMedia.length, likes: totalLikes, comments: totalComments, engagement: totalLikes + totalComments, views: totalViews, reach: igMedia.length * 100 }
      })
    } catch (e: any) {
      result.data.errors.push(`Instagram: ${e.message}`)
    }
    
    // 3. Fetch Ads (ads_read + ads_management)
    console.log('💰 Fetching Meta Ads...')
    for (const account of META_ADS_ACCOUNTS) {
      try {
        const campaigns = await fetchCampaigns(account.id)
        const insights = await fetchCampaignInsights(account.id, 30)
        
        for (const campaign of campaigns) {
          result.data.campaigns.push({ accountId: account.id, accountName: account.name, ...campaign })
        }
        
        await storeAdPerformance(account.id, account.name, insights)
      } catch (e: any) {
        result.data.errors.push(`Ads (${account.name}): ${e.message}`)
      }
    }
    
    // 4. Fetch Catalogs (catalog_management)
    console.log('📦 Fetching Product Catalogs...')
    try {
      const catalogs = await fetchCatalogs()
      result.data.catalogs = catalogs
      
      for (const business of catalogs) {
        for (const catalog of business.owned_product_catalogs?.data || []) {
          const products = await fetchCatalogProducts(catalog.id, 50)
          console.log(`Catalog ${catalog.name}: ${products.length} products`)
          
          // Store in dashboard settings
          await prisma.dashboardSettings.upsert({
            where: { id: 'catalog' },
            update: { metaAdsData: JSON.stringify({ catalogId: catalog.id, catalogName: catalog.name, products }) },
            create: { id: 'catalog', userId: 'system', metaAdsData: JSON.stringify({ catalogId: catalog.id, catalogName: catalog.name, products }) }
          })
        }
      }
    } catch (e: any) {
      result.data.errors.push(`Catalogs: ${e.message}`)
    }
    
    result.success = result.data.errors.length === 0
    result.durationMs = Date.now() - startTime
    
    console.log(`\n✅ Fetch complete in ${result.durationMs}ms`)
    console.log(`   Pages: ${result.data.pages.length}`)
    console.log(`   Campaigns: ${result.data.campaigns.length}`)
    console.log(`   Catalogs: ${result.data.catalogs.length}`)
    console.log(`   Errors: ${result.data.errors.length}`)
    
  } catch (e: any) {
    result.data.errors.push(`Main: ${e.message}`)
  }
  
  return result
}

// Export account list for reference
export { META_ADS_ACCOUNTS }