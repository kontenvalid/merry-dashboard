import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Generate the Composio MCP OAuth URL
    // This will redirect user to Composio for authentication
    const callbackUrl = `${process.env.NEXTAUTH_URL || 'https://merry-dashboard.vercel.app'}/api/composio/callback`
    
    // Build the auth URL with proper parameters
    const authUrl = new URL('https://connect.composio.dev/mcp')
    authUrl.searchParams.set('callback_url', callbackUrl)
    authUrl.searchParams.set('redirect_uri', callbackUrl)
    authUrl.searchParams.set('return_to', callbackUrl)
    
    // Add client ID for identification
    authUrl.searchParams.set('client_id', 'merry-dashboard')
    authUrl.searchParams.set('state', session.user.email || 'unknown')
    
    return NextResponse.json({
      authUrl: authUrl.toString(),
      callbackUrl: callbackUrl,
      message: 'Redirecting to Composio for authentication'
    })
  } catch (error) {
    console.error('Auth URL error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate auth URL',
      authUrl: 'https://connect.composio.dev/mcp'
    }, { status: 500 })
  }
}