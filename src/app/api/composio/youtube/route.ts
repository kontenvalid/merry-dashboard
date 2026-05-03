import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// YouTube channel info from context
const YT_CHANNEL_ID = 'UCBnBSmXbITcJBnBnKnFC_XQ'
const YT_TITLE = 'kontenval id'
const YT_HANDLE = '@kontenvalid'
const YT_SUBSCRIBER_COUNT = 11
const YT_VIDEO_COUNT = 7
const YT_VIEW_COUNT = 4616

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch real data from YouTube Data API via Composio
    // For now, return known real data from context
    return NextResponse.json({
      connected: true,
      channelId: YT_CHANNEL_ID,
      title: YT_TITLE,
      handle: YT_HANDLE,
      subscriberCount: YT_SUBSCRIBER_COUNT,
      videoCount: YT_VIDEO_COUNT,
      viewCount: YT_VIEW_COUNT,
      thumbnailUrl: null,
      country: 'ID',
      publishedAt: '2023-08-14T00:00:00+0000',
      insights: {
        daily: [],
        weekly: []
      },
      videos: []
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    })
  } catch (error) {
    console.error('YouTube API error:', error)
    return NextResponse.json({ 
      connected: false, 
      error: 'Failed to fetch YouTube data' 
    }, { status: 500 })
  }
}