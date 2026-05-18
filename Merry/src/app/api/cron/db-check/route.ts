import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Debug/check database state for current user
export async function GET() {
  try {
    // Get session to identify user
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Please login first' 
      }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    const userId = user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check analytics table for this user
    const analyticsCount = await prisma.analytics.count({
      where: { userId: userId }
    })
    const analyticsRecords = await prisma.analytics.findMany({
      where: { 
        userId: userId,
        date: today 
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Check settings table for this user
    const settings = await prisma.dashboardSettings.findUnique({
      where: { userId: userId }
    })

    // Check api keys table for this user
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: userId }
    })

    return NextResponse.json({
      success: true,
      debug: true,
      userId: userId,
      userEmail: user.email,
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
      apiKeys: apiKeys.map(k => ({
        service: k.service,
        isActive: k.isActive,
        createdAt: k.createdAt
      }))
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}