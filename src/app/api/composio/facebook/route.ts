import { NextResponse } from 'next/server'

export async function GET() {
  // Facebook Page insights
  const data = {
    connected: true,
    pages: [
      {
        id: '1080250281836384',
        name: 'kontenval.id',
        username: 'kontenval.id',
        fanCount: 6,
        followersCount: 6,
        link: 'https://www.facebook.com/1080250281836384'
      }
    ],
    insights: {
      daily: [
        { date: '2026-04-27', followers: 5, engagement: 12, reach: 150 },
        { date: '2026-04-28', followers: 5, engagement: 8, reach: 120 },
        { date: '2026-04-29', followers: 6, engagement: 15, reach: 200 },
        { date: '2026-04-30', followers: 6, engagement: 10, reach: 180 },
        { date: '2026-05-01', followers: 6, engagement: 14, reach: 190 },
        { date: '2026-05-02', followers: 6, engagement: 9, reach: 160 },
        { date: '2026-05-03', followers: 6, engagement: 11, reach: 175 }
      ],
      weekly: [
        { week: 'Week 1', followers: 4, engagement: 45, reach: 520 },
        { week: 'Week 2', followers: 5, engagement: 62, reach: 680 },
        { week: 'Week 3', followers: 6, engagement: 71, reach: 755 },
        { week: 'Week 4', followers: 6, engagement: 56, reach: 705 }
      ]
    },
    posts: [
      {
        id: 'post_1',
        message: 'Tips Sukses Affiliate Marketing untuk Pemula...',
        createdTime: '2026-05-02T10:00:00+0000',
        permalinkUrl: 'https://www.facebook.com/1080250281836384/posts/post_1',
        engagement: { reactions: 5, comments: 2, shares: 1 }
      },
      {
        id: 'post_2',
        message: 'Kontenval.id Official Content',
        createdTime: '2026-05-01T14:30:00+0000',
        permalinkUrl: 'https://www.facebook.com/1080250281836384/posts/post_2',
        engagement: { reactions: 3, comments: 1, shares: 0 }
      }
    ]
  }
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}
