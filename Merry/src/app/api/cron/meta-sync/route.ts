/**
 * Meta Data Sync API
 * Fetches data from Meta Graph API and stores in database
 * Uses all 12 available permissions
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { fetchAllData, META_ADS_ACCOUNTS, setMetaToken } from '@/lib/meta-fetcher'

// GET - Trigger manual sync
export async function GET() {
  const startTime = Date.now()
  
  try {
    // Get Meta token from database - search by service, any user
    const apiKey = await prisma.apiKey.findFirst({
      where: { service: 'meta_graph', isActive: true }
    })
    
    if (!apiKey?.apiKey) {
      return NextResponse.json({
        success: false,
        error: 'No Meta Access Token found',
        message: 'Please configure your Meta Graph API token in Settings'
      }, { status: 400 })
    }
    
    // Set token for fetcher
    setMetaToken(apiKey.apiKey)
    
    // Fetch all data
    console.log('🚀 Starting Meta data sync...')
    const result = await fetchAllData()
    
    // Update last sync timestamp
    await prisma.dashboardSettings.upsert({
      where: { id: 'sync_status' },
      update: { updatedAt: new Date(), metaAdsData: JSON.stringify({ lastSync: new Date().toISOString(), result }) },
      create: { 
        id: 'sync_status', 
        userId: 'system',
        metaAdsData: JSON.stringify({ lastSync: new Date().toISOString(), result }) 
      }
    })
    
    return NextResponse.json({
      success: result.success,
      syncedAt: result.timestamp,
      durationMs: Date.now() - startTime,
      summary: {
        pages: result.data.pages.length,
        campaigns: result.data.campaigns.length,
        catalogs: result.data.catalogs.length,
        errors: result.data.errors.length
      },
      errors: result.data.errors,
      data: result.data
    })
    
  } catch (error: any) {
    console.error('Meta sync error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      durationMs: Date.now() - startTime
    }, { status: 500 })
  }
}