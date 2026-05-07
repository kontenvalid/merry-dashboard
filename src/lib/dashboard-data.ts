// Shared dashboard data service
// Reads from database (cached from cron) and composes for UI

import prisma from './prisma'

// Meta Ads accounts
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]

// Get today's date (date only)
function getTodayDate() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export interface PlatformData {
  connected: boolean;
  name: string;
  handle: string;
  followers?: number;
  followers_count?: number;
  subscribers?: number;
  reach?: number;
  views?: number;
  posts?: number;
  mediaCount?: number;
  videoCount?: number;
  viewCount?: number;
  engagement?: {
    likes?: number;
    comments?: number;
    saves?: number;
    shares?: number;
  };
  posts_stats?: { reach?: number; impressions?: number };
  link?: string;
  raw?: any;
}

export interface DashboardData {
  facebook: PlatformData;
  instagram: PlatformData;
  youtube: PlatformData;
  metaAds: {
    connected: boolean;
    accounts: any[];
    campaigns: any[];
    summary: {
      totalSpend: number;
      totalCampaigns: number;
      avgCPC: number;
    };
  };
  googleDrive: {
    connected: boolean;
    fileCount: number;
  };
  timestamp: string;
  source: string;
}

// Fetch dashboard data from database
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const result: DashboardData = {
    facebook: { connected: false, name: 'Facebook', handle: '@kontenval.id' },
    instagram: { connected: false, name: 'Instagram', handle: '@kontenval.id' },
    youtube: { connected: false, name: 'YouTube', handle: '@kontenvalid' },
    metaAds: { connected: false, accounts: META_ADS_ACCOUNTS, campaigns: [], summary: { totalSpend: 0, totalCampaigns: 0, avgCPC: 0 } },
    googleDrive: { connected: false, fileCount: 0 },
    timestamp: new Date().toISOString(),
    source: 'database'
  }

  try {
    const today = getTodayDate()

    // Fetch analytics data from database (cached from cron)
    const analyticsRecords = await prisma.analytics.findMany({
      where: {
        date: today
      }
    })

    // Map database records to dashboard format
    for (const record of analyticsRecords) {
      switch (record.platform) {
        case 'FACEBOOK':
          result.facebook = {
            connected: record.followers > 0,
            name: 'Facebook Page',
            handle: '@kontenval.id',
            followers: record.followers,
            posts: record.posts,
            reach: record.reach,
            engagement: {
              likes: record.likes,
              comments: record.comments,
              shares: record.shares,
            },
            posts_stats: {
              reach: record.reach,
              impressions: record.impressions,
            },
            link: 'https://www.facebook.com/kontenval.id'
          }
          break
        case 'INSTAGRAM':
          result.instagram = {
            connected: record.followers > 0,
            name: 'Instagram',
            handle: '@kontenval.id',
            followers: record.followers,
            posts: record.posts,
            mediaCount: record.posts,
            reach: record.reach,
            engagement: {
              likes: record.likes,
              comments: record.comments,
            },
            posts_stats: {
              reach: record.reach,
              impressions: record.impressions,
            },
            link: 'https://instagram.com/kontenval.id'
          }
          break
        case 'YOUTUBE':
          result.youtube = {
            connected: record.followers > 0,
            name: 'YouTube Channel',
            handle: '@kontenvalid',
            subscribers: record.followers,
            videoCount: record.posts,
            viewCount: record.views,
            views: record.views,
            engagement: {
              likes: record.likes,
              comments: record.comments,
            },
            link: 'https://youtube.com/@kontenvalid'
          }
          break
      }
    }

    // Check if we have data - if not, mark source as empty
    if (analyticsRecords.length === 0) {
      result.source = 'no_data'
    }

    return result
  } catch (error: any) {
    console.error('Dashboard data fetch error:', error)
    result.source = 'error'
    return result
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
  if (data.youtube.subscribers) total += data.youtube.subscribers
  return total || 0
}