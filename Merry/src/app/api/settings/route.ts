import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { saveApiKey, getApiKey, hasApiKey } from '@/lib/api-key-store'

// GET - Get dashboard settings
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id || session.user.email

  // Get dashboard settings from database
  let settings = await prisma.dashboardSettings.findUnique({
    where: { id: userId }
  })

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.dashboardSettings.create({
      data: { userId, id: userId }
    })
  }

  // Check API key status (don't expose the actual key)
  const composioConnected = await hasApiKey(userId, 'composio')
  const metaConnected = await hasApiKey(userId, 'meta_graph')

  return NextResponse.json({
    success: true,
    settings: {
      theme: settings.theme,
      language: settings.language,
      timezone: settings.timezone,
      composioConnected,
      metaConnected
    }
  })
}

// PUT - Update dashboard settings
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id || session.user.email

  try {
    const body = await request.json()
    const { 
      theme, 
      language, 
      timezone,
      composioApiKey,
      metaAccessToken,
      metaAdsAccountIds,
      gdriveFolderId,
      gdriveFolderName
    } = body

    // Update dashboard settings
    await prisma.dashboardSettings.upsert({
      where: { id: userId },
      update: {
        theme: theme || 'system',
        language: language || 'en',
        timezone: timezone || 'Asia/Bangkok'
      },
      create: {
        id: userId,
        userId,
        theme: theme || 'system',
        language: language || 'en',
        timezone: timezone || 'Asia/Bangkok'
      }
    })

    // Save API keys if provided
    if (composioApiKey) {
      await saveApiKey(userId, 'composio', composioApiKey, { 
        addedAt: new Date().toISOString() 
      })
    }

    if (metaAccessToken) {
      await saveApiKey(userId, 'meta_graph', metaAccessToken, {
        addedAt: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved'
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}