import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getConsumerApiKey } from '@/lib/composio-store'

// Cron configuration for Vercel
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Max 60 seconds for cron

// This endpoint will be called by Vercel Cron daily at 6 AM
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/sync", "schedule": "0 6 * * *" }] }

export async function GET(request: Request) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results: any = {
    startTime: new Date().toISOString(),
    syncs: [],
    errors: []
  }

  try {
    // Fetch current data from Composio overview
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/composio/overview`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch overview data from Composio')
    }

    const overviewData = await response.json()
    const { data } = overviewData

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Sync Facebook data
    if (data?.facebook) {
      try {
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
        results.syncs.push({ platform: 'FACEBOOK', status: 'success' })
      } catch (error: any) {
        results.errors.push({ platform: 'FACEBOOK', error: error.message })
      }
    }

    // Sync Instagram data
    if (data?.instagram) {
      try {
        await prisma.analytics.upsert({
          where: {
            platform_date: {
              platform: 'INSTAGRAM',
              date: today
            }
          },
          update: {
            followers: data.instagram.followers || 0,
            reach: data.instagram.posts?.reach || 0,
            impressions: data.instagram.posts?.impressions || 0,
            engagement: (data.instagram.engagement?.likes || 0) + 
                       (data.instagram.engagement?.comments || 0)
          },
          create: {
            platform: 'INSTAGRAM',
            date: today,
            followers: data.instagram.followers || 0,
            reach: data.instagram.posts?.reach || 0,
            impressions: data.instagram.posts?.impressions || 0,
            engagement: (data.instagram.engagement?.likes || 0) + 
                       (data.instagram.engagement?.comments || 0)
          }
        })
        results.syncs.push({ platform: 'INSTAGRAM', status: 'success' })
      } catch (error: any) {
        results.errors.push({ platform: 'INSTAGRAM', error: error.message })
      }
    }

    // Sync YouTube data
    if (data?.youtube) {
      try {
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
        results.syncs.push({ platform: 'YOUTUBE', status: 'success' })
      } catch (error: any) {
        results.errors.push({ platform: 'YOUTUBE', error: error.message })
      }
    }

    results.endTime = new Date().toISOString()
    results.totalDuration = Date.now() - startTime
    results.message = `Synced ${results.syncs.length} platforms successfully`

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Cron sync error:', error)
    return NextResponse.json({
      error: 'Sync failed',
      message: error.message,
      startTime: results.startTime,
      endTime: new Date().toISOString()
    }, { status: 500 })
  }
}