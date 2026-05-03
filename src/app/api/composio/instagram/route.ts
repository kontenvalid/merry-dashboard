import { NextResponse } from 'next/server'

export async function GET() {
  // Instagram insights
  const data = {
    connected: true,
    username: 'kontenval.id',
    followersCount: 0,
    followsCount: 0,
    mediaCount: 7,
    profileUrl: 'https://instagram.com/kontenval.id',
    insights: {
      daily: [
        { date: '2026-04-27', reach: 45, impressions: 120, engagement: 8 },
        { date: '2026-04-28', reach: 52, impressions: 145, engagement: 12 },
        { date: '2026-04-29', reach: 38, impressions: 98, engagement: 6 },
        { date: '2026-04-30', reach: 61, impressions: 180, engagement: 15 },
        { date: '2026-05-01', reach: 55, impressions: 155, engagement: 10 },
        { date: '2026-05-02', reach: 48, impressions: 130, engagement: 9 },
        { date: '2026-05-03', reach: 72, impressions: 210, engagement: 18 }
      ],
      weekly: [
        { week: 'Week 1', reach: 180, impressions: 450, engagement: 35 },
        { week: 'Week 2', reach: 220, impressions: 580, engagement: 48 },
        { week: 'Week 3', reach: 195, impressions: 510, engagement: 38 },
        { week: 'Week 4', reach: 285, impressions: 765, engagement: 52 }
      ]
    },
    media: [
      {
        id: 'media_1',
        caption: 'Reels Tutorial Affiliate Marketing...',
        mediaType: 'VIDEO',
        permalink: 'https://instagram.com/p/media_1',
        likeCount: 45,
        commentsCount: 8,
        timestamp: '2026-05-01T12:00:00+0000'
      },
      {
        id: 'media_2',
        caption: 'Carousel Content Strategy',
        mediaType: 'CAROUSEL_ALBUM',
        permalink: 'https://instagram.com/p/media_2',
        likeCount: 32,
        commentsCount: 5,
        timestamp: '2026-04-28T14:30:00+0000'
      }
    ]
  }
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}
