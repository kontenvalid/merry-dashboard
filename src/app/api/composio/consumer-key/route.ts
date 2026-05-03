import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { setConsumerApiKey, deleteConsumerApiKey, hasConsumerApiKey } from '@/lib/composio-store'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userEmail = session.user.email
  const hasKey = hasConsumerApiKey(userEmail) || !!process.env.COMPOSIO_API_KEY

  return NextResponse.json({
    hasKey,
    maskedKey: hasKey ? '••••••••' : null // Don't expose actual key
  })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { consumerApiKey } = await request.json()
    
    if (!consumerApiKey || typeof consumerApiKey !== 'string') {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 400 })
    }

    // Validate key format (basic check)
    if (consumerApiKey.length < 10) {
      return NextResponse.json({ error: 'API key too short' }, { status: 400 })
    }

    const userEmail = session.user.email
    
    // Store using shared store (in production, encrypt this!)
    setConsumerApiKey(userEmail, consumerApiKey)

    // Also save to environment variable for Composio SDK (if needed)
    process.env.COMPOSIO_CONSUMER_API_KEY = consumerApiKey

    return NextResponse.json({
      success: true,
      maskedKey: `••••${consumerApiKey.substring(consumerApiKey.length - 4)}`
    })
  } catch (error) {
    console.error('Save consumer API key error:', error)
    return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userEmail = session.user.email
  deleteConsumerApiKey(userEmail)

  return NextResponse.json({ success: true })
}