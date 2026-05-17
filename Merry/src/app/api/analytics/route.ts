import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getApiKey } from '@/lib/api-key-store'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id || session.user.email
    const apiKey = await getApiKey(userId, 'composio')

    if (!apiKey) {
      return NextResponse.json({ error: 'Composio API key not configured. Please connect via Settings.' }, { status: 400 })
    }

    // Fetch current data from Composio
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/composio/overview`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch overview data')
    }

    const overviewData = await response.json()
    const { data } = overviewData

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const results = []

    // Sync Facebook data
    if (data?.facebook) {
      await prisma.analytics.upsert({
        where: {
          platform_date: {
            platform: 'FACEBOOK',
            date: today
          }
        },
        update: {
          followers: data.facebook.followers || 0,
          reach: data.facebook.posts?.reach || 0,
          impressions: data.facebook.posts?.impressions || 0,
          engagement: (data.facebook.engagement?.likes || 0) + 
                     (data.facebook.engagement?.comments || 0) +
                     (data.facebook.engagement?.shares || 0)
        },
        create: {
          platform: 'FACEBOOK',
          date: today,
          followers: data.facebook.followers || 0,
          reach: data.facebook.posts?.reach || 0,
          impressions: data.facebook.posts?.impressions || 0,
          engagement: (data.facebook.engagement?.likes || 0) + 
                     (data.facebook.engagement?.comments || 0) +
                     (data.facebook.engagement?.shares || 0)
        }
      })
      results.push({ platform: 'FACEBOOK', status: 'synced' })
    }

    // Sync Instagram data
    if (data?.instagram) {
      await prisma.analytics.upsert({
        where: {
          platform_date: {
            platform: 'INSTAGRAM',
            date: today
          }
        },
        update: {
          followers: data.instagram.followers_count || 0,
          reach: data.instagram.posts?.reach || 0,
          impressions: data.instagram.posts?.impressions || 0,
          engagement: (data.instagram.engagement?.likes || 0) + 
                     (data.instagram.engagement?.comments || 0)
        },
        create: {
          platform: 'INSTAGRAM',
          date: today,
          followers: data.instagram.followers_count || 0,
          reach: data.instagram.posts?.reach || 0,
          impressions: data.instagram.posts?.impressions || 0,
          engagement: (data.instagram.engagement?.likes || 0) + 
                     (data.instagram.engagement?.comments || 0)
        }
      })
      results.push({ platform: 'INSTAGRAM', status: 'synced' })
    }

    // Sync YouTube data
    if (data?.youtube) {
      await prisma.analytics.upsert({
        where: {
          platform_date: {
            platform: 'YOUTUBE',
            date: today
          }
        },
        update: {
          followers: data.youtube.subscribers || 0,
          views: data.youtube.stats?.totalViews || 0,
          reach: data.youtube.stats?.totalViews || 0,
          engagement: data.youtube.engagement?.likes || 0,
          watchTime: data.youtube.stats?.watchTimeMinutes || 0
        },
        create: {
          platform: 'YOUTUBE',
          date: today,
          followers: data.youtube.subscribers || 0,
          views: data.youtube.stats?.totalViews || 0,
          reach: data.youtube.stats?.totalViews || 0,
          engagement: data.youtube.engagement?.likes || 0,
          watchTime: data.youtube.stats?.watchTimeMinutes || 0
        }
      })
      results.push({ platform: 'YOUTUBE', status: 'synced' })
    }

    return NextResponse.json({
      success: true,
      date: today.toISOString(),
      results
    })

  } catch (error: any) {
    console.error('Sync analytics error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to sync analytics' 
    }, { status: 500 })
  }
}

// GET - Fetch historical analytics from database
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const platform = searchParams.get('platform') || 'all'

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Build where clause with proper typing
    const whereClause: any = {
      date: {
        gte: startDate
      }
    }
    
    if (platform !== 'all') {
      const platformMap: Record<string, 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE' | 'META_ADS'> = {
        facebook: 'FACEBOOK',
        instagram: 'INSTAGRAM',
        youtube: 'YOUTUBE',
        meta_ads: 'META_ADS'
      }
      whereClause.platform = platformMap[platform.toLowerCase()] || 'FACEBOOK'
    }

    const analytics = await prisma.analytics.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        days,
        platform,
        count: analytics.length
      }
    })

  } catch (error: any) {
    console.error('Fetch analytics error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch analytics' 
    }, { status: 500 })
  }
}