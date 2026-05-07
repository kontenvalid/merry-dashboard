import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getApiKey } from '@/lib/api-key-store'
import { fetchAllSocialData, fetchGoogleDriveFiles, testMcpConnection, SocialMediaData, GoogleDriveFile } from '@/lib/composio-mcp'

// GET - Manual trigger or scheduled sync
export async function GET(request: Request) {
  try {
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

    console.log('MCP connection OK. Tools available:', connectionTest.toolsCount)

    // Fetch all social media data using COMPOSIO_MULTI_EXECUTE_TOOL
    const socialData = await fetchAllSocialData(apiKey)

    // Store social media results in database
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const results: any[] = []
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
            watchTime: data.watchTime,
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
            watchTime: data.watchTime,
          }
        })
        results.push({ 
          platform: data.platform, 
          success: true, 
          data: {
            followers: data.followers,
            posts: data.posts,
            likes: data.likes,
            comments: data.comments,
            shares: data.shares,
            reach: data.reach,
            views: data.views
          }
        })
      } catch (dbError: any) {
        console.error(`Failed to save ${data.platform} data:`, dbError)
        results.push({ platform: data.platform, success: false, error: dbError.message })
      }
    }

    // Fetch Google Drive files
    const gdriveResult = await fetchGoogleDriveFiles(apiKey)
    let gdriveFiles: GoogleDriveFile[] = []
    if (gdriveResult.success) {
      gdriveFiles = gdriveResult.files
    }

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      platforms: results.length,
      toolsAvailable: connectionTest.toolsCount,
      socialData: results,
      googleDrive: {
        success: gdriveResult.success,
        fileCount: gdriveFiles.length,
        files: gdriveFiles.slice(0, 10).map(f => ({ id: f.id, name: f.name, type: f.mimeType })),
        error: gdriveResult.error
      },
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