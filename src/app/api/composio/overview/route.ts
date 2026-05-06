import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchDashboardData } from '@/lib/dashboard-data'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id || session.user.email

  try {
    const data = await fetchDashboardData(userId)
    
    return NextResponse.json({
      success: true,
      source: data.source,
      timestamp: data.timestamp,
      data: {
        facebook: data.facebook,
        instagram: data.instagram,
        youtube: data.youtube,
        metaAds: data.metaAds,
        googleDrive: data.googleDrive
      }
    })
  } catch (error: any) {
    console.error('Overview API error:', error)
    return NextResponse.json({
      success: false,
      source: 'error',
      error: error.message
    }, { status: 500 })
  }
}
