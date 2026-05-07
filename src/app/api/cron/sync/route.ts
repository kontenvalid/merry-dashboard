import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getApiKey } from '@/lib/api-key-store'
import { fetchAllSocialData, testMcpConnection } from '@/lib/composio-mcp'

// GET - Manual trigger or scheduled sync
export async function GET(request: Request) {
  try {
    // Optional: verify cron secret for scheduled jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'merry-cron-secret'
    
    // For demo, allow without auth. In production, check auth
    // if (authHeader !== `Bearer ${cronSecret}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Get user from query or use default
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'kontenval.id@gmail.com'

    // Get API key from database
    const apiKey = await getApiKey(userId, 'composio')

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'No Composio API key found',
        message: 'Please configure Composio API key in Settings'
      }, { status: 400 })
    }

    // Test MCP connection first
    const connectionTest = await testMcpConnection(apiKey)
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'MCP connection failed',
        details: connectionTest.error,
        message: 'Failed to connect to Composio MCP. Please check your API key.'
      }, { status: 500 })
    }

    // Fetch all social media data
    const socialData = await fetchAllSocialData(apiKey)

    // Store results in database
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const results = []
    for (const data of socialData) {
      try {
        const record = await prisma.analytics.upsert({
          where: {
            platform_date: {
              platform: data.platform,
              date: today
            }
          },
          update: {
            followers: data.followers,
            following: data.following,
            posts: data.posts,
            engagement: data.engagement,
            reach: data.reach,
            impressions: data.impressions,
            likes: data.likes,
            comments: data.comments,
            shares: data.shares,
            views: data.views,
          },
          create: {
            platform: data.platform,
            date: today,
            followers: data.followers,
            following: data.following,
            posts: data.posts,
            engagement: data.engagement,
            reach: data.reach,
            impressions: data.impressions,
            likes: data.likes,
            comments: data.comments,
            shares: data.shares,
            views: data.views,
          }
        })
        results.push({ platform: data.platform, success: true, record })
      } catch (dbError: any) {
        results.push({ platform: data.platform, success: false, error: dbError.message })
      }
    }

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      platforms: results.length,
      toolsAvailable: connectionTest.toolsCount,
      results
    })
  } catch (error: any) {
    console.error('Cron sync error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// POST - Also allow POST for webhook triggers
export async function POST(request: Request) {
  return GET(request)
}