import { NextResponse } from 'next/server'

export async function GET() {
  // Static data mimicking real API response
  // In production, this would call Composio SDK
  
  const data = {
    facebook: {
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
      ]
    },
    instagram: {
      connected: true,
      username: 'kontenval.id',
      followersCount: 0,
      mediaCount: 7,
      profileUrl: 'https://instagram.com/kontenval.id'
    },
    youtube: {
      connected: true,
      channelId: 'UCK2C25kK4E3PR6w0gPNCjaA',
      title: 'kontenval id',
      handle: '@kontenvalid',
      subscriberCount: 11,
      videoCount: 7,
      viewCount: 4616
    },
    metaAds: {
      connected: false,
      error: 'Session expired - please reconnect Meta Ads in Composio'
    },
    googleDrive: {
      connected: true,
      ebookFolder: {
        id: '1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF',
        name: 'Ebook',
        link: 'https://drive.google.com/drive/folders/1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF'
      },
      files: []
    },
    gmail: {
      connected: true,
      email: 'kontenval.id@gmail.com',
      messagesTotal: 93,
      threadsTotal: 84
    },
    summary: {
      totalFollowers: 17, // FB (6) + IG (0) + YT (11)
      totalContent: 14,  // IG posts (7) + YT videos (7)
      activePlatforms: 4, // FB, IG, YT, GDrive
      totalReach: 4616   // YT views as proxy
    }
  }
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}
