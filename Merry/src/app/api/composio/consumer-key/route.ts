import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { saveApiKey, getApiKey, hasApiKey, deleteApiKey } from '@/lib/api-key-store'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id || session.user.email
  
  // Check from database (primary) and environment (fallback)
  const hasKeyInDb = await hasApiKey(userId, 'composio')
  const hasKeyInEnv = !!process.env.COMPOSIO_API_KEY
  const hasKey = hasKeyInDb || hasKeyInEnv

  return NextResponse.json({
    hasKey,
    source: hasKeyInDb ? 'database' : hasKeyInEnv ? 'environment' : 'none',
    maskedKey: hasKey ? '••••••••' : null
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

    const userId = session.user.id || session.user.email
    
    // Store in database for persistence across deployments
    await saveApiKey(userId, 'composio', consumerApiKey, { 
      addedAt: new Date().toISOString(),
      source: 'user_input'
    })

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

  const userId = session.user.id || session.user.email
  await deleteApiKey(userId, 'composio')

  return NextResponse.json({ success: true })
}