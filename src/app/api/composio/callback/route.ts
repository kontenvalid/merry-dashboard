import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    if (error) {
      // Auth failed, redirect to settings with error
      return NextResponse.redirect(
        new URL('/settings?error=composio_auth_failed', request.url)
      )
    }
    
    if (code) {
      // Exchange code for API key (if Composio supports this flow)
      // For now, just mark as connected and redirect
      console.log('Composio auth code received:', code)
    }
    
    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/settings?connected=true', request.url)
    )
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=callback_failed', request.url)
    )
  }
}