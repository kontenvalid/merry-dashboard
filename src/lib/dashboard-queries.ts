/**
 * Dashboard Data Queries
 * Helper functions to fetch and aggregate data for dashboard display
 */

import prisma from '@/lib/prisma'

// ============ ANALYTICS QUERIES ============

/**
 * Get latest analytics for all platforms
 */
export async function getLatestAnalytics() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Get latest record for each platform
  const records = await prisma.$queryRaw<any[]>`
    SELECT DISTINCT ON (platform) *
    FROM analytics
    WHERE date <= ${today}
    ORDER BY platform, date DESC
  `
  
  return records
}

/**
 * Get analytics trend for last N days
 */
export async function getAnalyticsTrend(days: number = 30, platform?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days)
  
  const where: any = {
    date: {
      gte: startDate,
      lte: today
    }
  }
  
  if (platform) {
    where.platform = platform
  }
  
  return prisma.analytics.findMany({
    where,
    orderBy: { date: 'asc' }
  })
}

/**
 * Get total followers across all platforms
 */
export async function getTotalFollowers() {
  const latest = await getLatestAnalytics()
  return latest.reduce((sum, r) => sum + r.followers, 0)
}

/**
 * Get platform breakdown with percentages
 */
export async function getPlatformBreakdown() {
  const latest = await getLatestAnalytics()
  const total = latest.reduce((sum, r) => sum + r.followers, 0)
  
  return latest.map(r => ({
    platform: r.platform,
    followers: r.followers,
    percentage: total > 0 ? (r.followers / total) * 100 : 0
  }))
}

// ============ AD PERFORMANCE QUERIES ============

/**
 * Get ad performance summary
 */
export async function getAdPerformanceSummary(accountId?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 30)
  
  const where: any = {
    date: {
      gte: startDate,
      lte: today
    }
  }
  
  if (accountId) {
    where.accountId = accountId
  }
  
  const records = await prisma.adPerformance.findMany({
    where,
    orderBy: { date: 'asc' }
  })
  
  // Aggregate
  const totalSpend = records.reduce((sum, r) => sum + Number(r.spend), 0)
  const totalImpressions = records.reduce((sum, r) => sum + r.impressions, 0)
  const totalClicks = records.reduce((sum, r) => sum + r.clicks, 0)
  const totalConversions = records.reduce((sum, r) => sum + r.conversions, 0)
  
  return {
    records,
    summary: {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
      avgCPM: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
    }
  }
}

/**
 * Get ad spend by account
 */
export async function getSpendByAccount() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 30)
  
  const records = await prisma.adPerformance.groupBy({
    by: ['accountId'],
    where: {
      date: {
        gte: startDate,
        lte: today
      }
    },
    _sum: {
      spend: true,
      impressions: true,
      clicks: true
    }
  })
  
  return records.map(r => ({
    accountId: r.accountId,
    spend: r._sum.spend || 0,
    impressions: r._sum.impressions || 0,
    clicks: r._sum.clicks || 0
  }))
}

// ============ DASHBOARD OVERVIEW ============

export interface DashboardOverview {
  followers: {
    total: number
    breakdown: { platform: string; count: number; change: number }[]
  }
  engagement: {
    total: number
    breakdown: { platform: string; count: number }[]
  }
  reach: {
    total: number
    trend: { date: string; value: number }[]
  }
  ads: {
    totalSpend: number
    totalImpressions: number
    avgCPC: number
  }
  lastUpdated: Date | null
}

/**
 * Get complete dashboard overview data
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const latest = await getLatestAnalytics()
  const trend = await getAnalyticsTrend(7)
  
  // Calculate follower changes (compare with yesterday)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  
  const yesterdayRecords = await prisma.analytics.findMany({
    where: { date: yesterday }
  })
  
  const followerBreakdown = latest.map(current => {
    const yesterday = yesterdayRecords.find(r => r.platform === current.platform)
    const change = yesterday ? current.followers - yesterday.followers : 0
    return {
      platform: current.platform,
      count: current.followers,
      change
    }
  })
  
  // Engagement breakdown
  const engagementBreakdown = latest.map(r => ({
    platform: r.platform,
    count: r.engagement
  }))
  
  // Reach trend
  const reachTrend = trend.map(r => ({
    date: r.date.toISOString().split('T')[0],
    value: r.reach + r.impressions
  }))
  
  // Ad summary
  const adSummary = await getAdPerformanceSummary()
  
  // Last update
  const lastUpdate = await prisma.analytics.findFirst({
    orderBy: { updatedAt: 'desc' }
  })
  
  return {
    followers: {
      total: latest.reduce((sum, r) => sum + r.followers, 0),
      breakdown: followerBreakdown
    },
    engagement: {
      total: latest.reduce((sum, r) => sum + r.engagement, 0),
      breakdown: engagementBreakdown
    },
    reach: {
      total: latest.reduce((sum, r) => sum + r.reach + r.impressions, 0),
      trend: reachTrend
    },
    ads: {
      totalSpend: adSummary.summary.totalSpend,
      totalImpressions: adSummary.summary.totalImpressions,
      avgCPC: adSummary.summary.avgCPC
    },
    lastUpdated: lastUpdate?.updatedAt || null
  }
}

// ============ TOP CONTENT ============

export interface TopContent {
  platform: string
  type: string
  caption: string
  reach: number
  engagement: number
  date: Date
  url: string
}

/**
 * Get top performing content across platforms
 */
export async function getTopContent(limit: number = 10): Promise<TopContent[]> {
  // This would come from stored post data
  // For now, return aggregated stats
  const latest = await getLatestAnalytics()
  
  return latest.map(r => ({
    platform: r.platform,
    type: 'Aggregated',
    caption: `${r.posts} posts in period`,
    reach: r.reach + r.impressions,
    engagement: r.engagement,
    date: r.date,
    url: ''
  })).sort((a, b) => b.engagement - a.engagement).slice(0, limit)
}

// ============ SYNC STATUS ============

export interface SyncStatus {
  lastSync: Date | null
  status: 'healthy' | 'stale' | 'error'
  recordCount: number
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const lastRecord = await prisma.analytics.findFirst({
    orderBy: { updatedAt: 'desc' }
  })
  
  const recordCount = await prisma.analytics.count()
  
  let status: 'healthy' | 'stale' | 'error' = 'healthy'
  if (!lastRecord) {
    status = 'error'
  } else {
    const hoursSinceUpdate = (Date.now() - lastRecord.updatedAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceUpdate > 24) {
      status = 'stale'
    }
  }
  
  return {
    lastSync: lastRecord?.updatedAt || null,
    status,
    recordCount
  }
}

// ============ AGGREGATED STATS ============

/**
 * Get key metrics for cards
 */
export async function getKeyMetrics() {
  const latest = await getLatestAnalytics()
  
  const totalFollowers = latest.reduce((sum, r) => sum + r.followers, 0)
  const totalPosts = latest.reduce((sum, r) => sum + r.posts, 0)
  const totalEngagement = latest.reduce((sum, r) => sum + r.engagement, 0)
  const totalReach = latest.reduce((sum, r) => sum + r.reach + r.impressions, 0)
  
  // Calculate engagement rate
  const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0
  
  // Get ad spend
  const adSummary = await getAdPerformanceSummary()
  
  return {
    totalFollowers,
    totalPosts,
    totalEngagement,
    totalReach,
    engagementRate: Math.round(engagementRate * 100) / 100,
    totalAdSpend: adSummary.summary.totalSpend,
    avgCPC: Math.round(adSummary.summary.avgCPC * 100) / 100
  }
}