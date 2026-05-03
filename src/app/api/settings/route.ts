import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Settings storage (in production, use database or KV store)
let dashboardSettings = {
  composioApiKey: '',
  composioApiKeySet: false,
  theme: 'system',
  language: 'en',
  timezone: 'Asia/Bangkok',
  autoSync: true,
  syncInterval: 60, // minutes
}

// GET - Get dashboard settings
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Don't expose the actual API key, just whether it's set
  return NextResponse.json({
    success: true,
    settings: {
      ...dashboardSettings,
      composioApiKey: dashboardSettings.composioApiKeySet ? '••••••••••••••••' : ''
    }
  })
}

// PUT - Update dashboard settings
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      composioApiKey, 
      theme, 
      language, 
      timezone, 
      autoSync, 
      syncInterval 
    } = body

    // Update settings
    if (composioApiKey !== undefined) {
      dashboardSettings.composioApiKey = composioApiKey
      dashboardSettings.composioApiKeySet = composioApiKey.length > 0
    }
    if (theme !== undefined) dashboardSettings.theme = theme
    if (language !== undefined) dashboardSettings.language = language
    if (timezone !== undefined) dashboardSettings.timezone = timezone
    if (autoSync !== undefined) dashboardSettings.autoSync = autoSync
    if (syncInterval !== undefined) dashboardSettings.syncInterval = syncInterval

    return NextResponse.json({
      success: true,
      settings: {
        ...dashboardSettings,
        composioApiKey: dashboardSettings.composioApiKeySet ? '••••••••••••••••' : ''
      }
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}