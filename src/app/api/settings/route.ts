import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Settings storage (in production, use database or KV store)
// Note: Meta Ads connection priority: Meta Graph API > Composio Meta Ads
// Note: GDrive folder ID is dynamic - can be updated via settings
let dashboardSettings = {
  composioApiKey: '',
  composioApiKeySet: false,
  // Meta Ads settings - token stored in meta-token.ts, configs here
  metaAdsAccountIds: [
    'act_66362051', // IDR - disabled
    'act_2180078045608935', // IDR - active
    'act_1985101938922115' // IDR - Barqun
  ],
  // Google Drive settings - folder ID is dynamic
  gdriveFolderId: '1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF',
  gdriveFolderName: 'Ebook',
  // UI settings
  theme: 'system',
  language: 'en',
  timezone: 'Asia/Bangkok',
  autoSync: true,
  syncInterval: 60, // minutes
}

// Export settings for use by other modules
export function getDashboardSettings() {
  return { ...dashboardSettings }
}

export function updateDashboardSettings(updates: Partial<typeof dashboardSettings>) {
  dashboardSettings = { ...dashboardSettings, ...updates }
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
      syncInterval,
      gdriveFolderId,
      gdriveFolderName,
      metaAdsAccountIds
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
    if (gdriveFolderId !== undefined) dashboardSettings.gdriveFolderId = gdriveFolderId
    if (gdriveFolderName !== undefined) dashboardSettings.gdriveFolderName = gdriveFolderName
    if (metaAdsAccountIds !== undefined) dashboardSettings.metaAdsAccountIds = metaAdsAccountIds

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