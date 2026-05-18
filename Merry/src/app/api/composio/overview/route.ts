import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Meta Ads accounts - this is global config, not user-specific
const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]

// GET - Read dashboard data from database (per user)
export async function GET() {
  try {
    // Get session to identify user
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        source: 'unauthorized',
        error: 'Please login first' 
      }, { status: 401 })
    }

    // Find user by email (dynamic, not hardcoded)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        source: 'user_not_found',
        error: 'User not found' 
      }, { status: 404 })
    }

    const userId = user.id
    console.log('Fetching data for user:', user.email, '(ID:', userId, ')')

    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0))

    // Fetch user's analytics records (filtered by userId)
    const analyticsRecords = await prisma.analytics.findMany({
      where: {
        userId: userId,
        date: today
      }
    })

    // Fetch user's settings for Meta Ads and Google Drive data (keyed by userId)
    const metaAdsSettings = await prisma.dashboardSettings.findFirst({
      where: { userId: userId }
    })
    const gdriveSettings = await prisma.dashboardSettings.findFirst({
      where: { userId: userId }
    })

    // Parse Meta Ads data
    let metaAds = { 
      connected: false, 
      accounts: META_ADS_ACCOUNTS, 
      campaigns: [], 
      summary: { totalSpend: 0, totalCampaigns: 0, avgCPC: 0 } 
    }
    if (metaAdsSettings?.metaAdsData) {
      try {
        const parsedMeta = JSON.parse(metaAdsSettings.metaAdsData)
        metaAds = {
          connected: true,
          accounts: META_ADS_ACCOUNTS,
          campaigns: parsedMeta.campaigns || [],
          summary: {
            totalSpend: parsedMeta.totalSpend || 0,
            totalCampaigns: (parsedMeta.campaigns || []).length,
            avgCPC: parsedMeta.avgCPC || 0
          }
        }
      } catch (e) {
        console.warn('Failed to parse metaAdsData:', e)
      }
    }

    // Parse Google Drive data
    let googleDrive = { 
      connected: false, 
      fileCount: 0, 
      folder: { id: '', name: '', link: '' } 
    }
    if (gdriveSettings?.googleDriveData) {
      try {
        const parsedGD = JSON.parse(gdriveSettings.googleDriveData)
        googleDrive = {
          connected: true,
          fileCount: parsedGD.fileCount || 0,
          folder: parsedGD.folder || { id: '', name: '', link: '' }
        }
      } catch (e) {
        console.warn('Failed to parse googleDriveData:', e)
      }
    }

    // Build dashboard data from database records
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
          }
          break
        case 'YOUTUBE':
          data.youtube = {
            followers: record.followers,
            posts: record.posts,
            likes: record.likes,
            comments: record.comments,
            views: record.views,
          }
          break
      }
    }

    // Get timestamp of last update
    const latestRecord = await prisma.analytics.findFirst({
      where: { userId: userId },
      orderBy: { updatedAt: 'desc' }
    })
    const lastUpdate = metaAdsSettings?.updatedAt || gdriveSettings?.updatedAt || latestRecord?.updatedAt

    return NextResponse.json({
      success: true,
      source: 'database',
      userId: userId,
      userEmail: user.email,
      timestamp: lastUpdate?.toISOString() || new Date().toISOString(),
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