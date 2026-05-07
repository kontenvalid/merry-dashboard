import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Meta Ads accounts
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]

// GET - Read dashboard data from database
export async function GET() {
  try {
    const userId = 'kontenval.id@gmail.com'
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch latest analytics from database
    const analyticsRecords = await prisma.analytics.findMany({
      where: {
        date: today
      }
    })

    // Fetch settings for Meta Ads and Google Drive data
    const settings = await prisma.dashboardSettings.findUnique({
      where: { id: userId }
    })

    // Parse Meta Ads data
    let metaAds = { connected: false, accounts: META_ADS_ACCOUNTS, campaigns: [], summary: { totalSpend: 0, totalCampaigns: 0, avgCPC: 0 } }
    if (settings?.metaAdsData) {
      try {
        const parsedMeta = JSON.parse(settings.metaAdsData)
        metaAds = {
          connected: true,
          accounts: META_ADS_ACCOUNTS,
          campaigns: parsedMeta.campaigns || [],
          summary: {
            totalSpend: parsedMeta.totalSpend || 0,
            totalCampaigns: (parsedMeta.campaigns || []).length,
            avgCPC: 0
          }
        }
      } catch (e) {
        console.warn('Failed to parse metaAdsData:', e)
      }
    }

    // Parse Google Drive data
    let googleDrive = { connected: false, fileCount: 0 }
    if (settings?.googleDriveData) {
      try {
        const parsedGD = JSON.parse(settings.googleDriveData)
        googleDrive = {
          connected: true,
          fileCount: parsedGD.fileCount || 0
        }
      } catch (e) {
        console.warn('Failed to parse googleDriveData:', e)
      }
    }

    // Build dashboard data from database records - use any to avoid type issues
    const data: any = {
      facebook: { followers: 0, posts: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 },
      instagram: { followers: 0, posts: 0, likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0 },
      youtube: { followers: 0, posts: 0, likes: 0, comments: 0, views: 0 },
      metaAds,
      googleDrive
    }

    for (const record of analyticsRecords) {
      switch (record.platform) {
        case 'FACEBOOK':
          data.facebook = {
            followers: record.followers,
            posts: record.posts,
            likes: record.likes,
            comments: record.comments,
            shares: record.shares,
            reach: record.reach,
            impressions: record.impressions,
            engagement: { likes: record.likes, comments: record.comments, shares: record.shares },
            posts_stats: { reach: record.reach, impressions: record.impressions }
          }
          break
        case 'INSTAGRAM':
          data.instagram = {
            followers: record.followers,
            posts: record.posts,
            likes: record.likes,
            comments: record.comments,
            shares: 0,
            reach: record.reach,
            impressions: record.impressions,
            engagement: { likes: record.likes, comments: record.comments },
            posts_stats: { reach: record.reach, impressions: record.impressions }
          }
          break
        case 'YOUTUBE':
          data.youtube = {
            followers: record.followers,
            posts: record.posts,
            likes: record.likes,
            comments: record.comments,
            views: record.views,
            engagement: { likes: record.likes, comments: record.comments }
          }
          break
      }
    }

    // Get timestamp of last update
    const latestRecord = await prisma.analytics.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      source: 'database',
      timestamp: settings?.updatedAt?.toISOString() || latestRecord?.updatedAt?.toISOString() || new Date().toISOString(),
      data
    })
  } catch (error: any) {
    console.error('Overview API error:', error)
    return NextResponse.json({
      success: false,
      source: 'error',
      error: error.message
    }, { status: 500 })
  }
}