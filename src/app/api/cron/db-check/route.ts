import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Simple test - just read analytics from DB
export async function GET() {
  try {
    const userId = 'kontenval.id@gmail.com'
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check analytics table
    const analyticsCount = await prisma.analytics.count()
    const analyticsRecords = await prisma.analytics.findMany({
      where: { date: today },
      orderBy: { updatedAt: 'desc' }
    })

    // Check settings table
    const settings = await prisma.dashboardSettings.findUnique({
      where: { id: userId }
    })

    // Check api keys table
    const apiKeysCount = await prisma.apiKey.count()

    return NextResponse.json({
      success: true,
      debug: true,
      timestamp: new Date().toISOString(),
      analytics: {
        totalCount: analyticsCount,
        todayCount: analyticsRecords.length,
        records: analyticsRecords.map(r => ({
          platform: r.platform,
          followers: r.followers,
          posts: r.posts,
          reach: r.reach,
          updatedAt: r.updatedAt
        }))
      },
      settings: {
        exists: !!settings,
        timezone: settings?.timezone,
        hasMetaAdsData: !!settings?.metaAdsData,
        hasGoogleDriveData: !!settings?.googleDriveData
      },
      apiKeysCount
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}