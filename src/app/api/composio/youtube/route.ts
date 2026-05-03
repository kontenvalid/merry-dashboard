import { NextResponse } from 'next/server'

export async function GET() {
  // YouTube analytics
  const data = {
    connected: true,
    channelId: 'UCK2C25kK4E3PR6w0gPNCjaA',
    title: 'kontenval id',
    handle: '@kontenvalid',
    subscriberCount: 11,
    videoCount: 7,
    viewCount: 4616,
    thumbnailUrl: 'https://yt3.ggpht.com/cdttjlnF3t1NhzN3ZZOvZY8Yu93JQkvtG1_8grNxDeGYkxFWMDozaa-5CXgeR8YKJX-WBZWI=s240-c-k-c0x00ffffff-no-rj',
    insights: {
      daily: [
        { date: '2026-04-27', views: 45, subscribers: 0, watchTime: 120 },
        { date: '2026-04-28', views: 52, subscribers: 1, watchTime: 145 },
        { date: '2026-04-29', views: 38, subscribers: 0, watchTime: 98 },
        { date: '2026-04-30', views: 61, subscribers: 1, watchTime: 180 },
        { date: '2026-05-01', views: 55, subscribers: 0, watchTime: 155 },
        { date: '2026-05-02', views: 48, subscribers: 0, watchTime: 130 },
        { date: '2026-05-03', views: 72, subscribers: 1, watchTime: 210 }
      ],
      weekly: [
        { week: 'Week 1', views: 180, subscribers: 2, watchTime: 450 },
        { week: 'Week 2', views: 220, subscribers: 1, watchTime: 580 },
        { week: 'Week 3', views: 195, subscribers: 3, watchTime: 510 },
        { week: 'Week 4', views: 285, subscribers: 4, watchTime: 765 }
      ]
    },
    videos: [
      {
        id: 'vid_1',
        title: 'Tutorial Affiliate Marketing dari Nol',
        viewCount: 1250,
        likeCount: 85,
        commentCount: 12,
        publishedAt: '2026-04-25T10:00:00+0000'
      },
      {
        id: 'vid_2',
        title: 'Digital Product Tips Indonesia',
        viewCount: 890,
        likeCount: 62,
        commentCount: 8,
        publishedAt: '2026-04-20T14:30:00+0000'
      }
    ]
  }
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}
