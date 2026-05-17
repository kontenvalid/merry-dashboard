/**
 * Improved Sync API - Uses Composio MCP Library
 * Fetches data from all platforms via Composio and stores to database
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getApiKey } from '@/lib/api-key-store'
import { fetchAllSocialData, fetchGoogleDriveFiles, testMcpConnection } from '@/lib/composio-mcp'

const META_ADS_ACCOUNTS = [
  { id: 'act_66362051', currency: 'USD', name: 'USD Account' },
  { id: 'act_2180078045608935', currency: 'IDR', name: 'IDR Account 1' },
  { id: 'act_1985101938922115', currency: 'IDR', name: 'Barqun Account' }
]
const META_API_BASE = 'https://graph.facebook.com/v21.0'

export async function GET() {
  const startTime = Date.now()
  const result: any = { 
    success: false, 
    syncedAt: new Date().toISOString(), 
    durationMs: 0, 
    platforms: [], 
    errors: [],
    details: {}
  }

  try {
    // Get Composio API key from database
    const userId = 'kontenval.id@gmail.com'
    const composioKey = await getApiKey(userId, 'composio')
    
    if (!composioKey) {
      return NextResponse.json({
        success: false,
        error: 'Composio API key not found',
        message: 'Please configure Composio API key in Settings'
      }, { status: 400 })
    }

    console.log('🔑 Composio API key found, testing connection...')
    
    // Test MCP connection
    const connectionTest = await testMcpConnection(composioKey)
    console.log('Connection test result:', connectionTest)
    
    if (!connectionTest.success) {
      result.errors.push({ service: 'Composio', error: connectionTest.error || 'Connection failed' })
    }

    // Fetch Facebook data
    console.log('📘 Fetching Facebook data...')
    try {
      const fbData = await fetchAllSocialData(composioKey)
      const fbRecord = fbData.find(d => d.platform === 'FACEBOOK')
      
      if (fbRecord) {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        await prisma.analytics.upsert({
          where: { platform_date: { platform: 'FACEBOOK', date: today } },
          update: {
            followers: fbRecord.followers,
            posts: fbRecord.posts,
            likes: fbRecord.likes,
            comments: fbRecord.comments,
            shares: fbRecord.shares,
            engagement: fbRecord.engagement,
            reach: fbRecord.reach,
            impressions: fbRecord.impressions
          },
          create: {
            platform: 'FACEBOOK',
            date: today,
            followers: fbRecord.followers,
            posts: fbRecord.posts,
            likes: fbRecord.likes,
            comments: fbRecord.comments,
            shares: fbRecord.shares,
            engagement: fbRecord.engagement,
            reach: fbRecord.reach,
            impressions: fbRecord.impressions
          }
        })
        result.platforms.push({ platform: 'Facebook', success: true, data: fbRecord })
        result.details.facebook = fbRecord
      }
    } catch (e: any) {
      console.error('Facebook error:', e)
      result.errors.push({ platform: 'Facebook', error: e.message })
    }

    // Fetch Instagram data
    console.log('📷 Fetching Instagram data...')
    try {
      const igData = await fetchAllSocialData(composioKey)
      const igRecord = igData.find(d => d.platform === 'INSTAGRAM')
      
      if (igRecord) {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        await prisma.analytics.upsert({
          where: { platform_date: { platform: 'INSTAGRAM', date: today } },
          update: {
            followers: igRecord.followers,
            posts: igRecord.posts,
            likes: igRecord.likes,
            comments: igRecord.comments,
            engagement: igRecord.engagement,
            reach: igRecord.reach,
            impressions: igRecord.impressions,
            views: igRecord.views
          },
          create: {
            platform: 'INSTAGRAM',
            date: today,
            followers: igRecord.followers,
            posts: igRecord.posts,
            likes: igRecord.likes,
            comments: igRecord.comments,
            engagement: igRecord.engagement,
            reach: igRecord.reach,
            impressions: igRecord.impressions,
            views: igRecord.views
          }
        })
        result.platforms.push({ platform: 'Instagram', success: true, data: igRecord })
        result.details.instagram = igRecord
      }
    } catch (e: any) {
      console.error('Instagram error:', e)
      result.errors.push({ platform: 'Instagram', error: e.message })
    }

    // Fetch YouTube data
    console.log('📺 Fetching YouTube data...')
    try {
      const ytData = await fetchAllSocialData(composioKey)
      const ytRecord = ytData.find(d => d.platform === 'YOUTUBE')
      
      if (ytRecord) {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        await prisma.analytics.upsert({
          where: { platform_date: { platform: 'YOUTUBE', date: today } },
          update: {
            followers: ytRecord.followers,
            posts: ytRecord.posts,
            likes: ytRecord.likes,
            comments: ytRecord.comments,
            engagement: ytRecord.engagement,
            reach: ytRecord.views,
            views: ytRecord.views,
            watchTime: ytRecord.watchTime
          },
          create: {
            platform: 'YOUTUBE',
            date: today,
            followers: ytRecord.followers,
            posts: ytRecord.posts,
            likes: ytRecord.likes,
            comments: ytRecord.comments,
            engagement: ytRecord.engagement,
            reach: ytRecord.views,
            views: ytRecord.views,
            watchTime: ytRecord.watchTime
          }
        })
        result.platforms.push({ platform: 'YouTube', success: true, data: ytRecord })
        result.details.youtube = ytRecord
      }
    } catch (e: any) {
      console.error('YouTube error:', e)
      result.errors.push({ platform: 'YouTube', error: e.message })
    }

    // Fetch Google Drive files
    console.log('📁 Fetching Google Drive files...')
    try {
      const gdriveResult = await fetchGoogleDriveFiles(composioKey)
      if (gdriveResult.success) {
        await prisma.dashboardSettings.upsert({
          where: { id: 'gdrive' },
          update: { googleDriveData: JSON.stringify({ fileCount: gdriveResult.files.length, files: gdriveResult.files.slice(0, 20) }) },
          create: { id: 'gdrive', userId: userId, googleDriveData: JSON.stringify({ fileCount: gdriveResult.files.length, files: gdriveResult.files.slice(0, 20) }) }
        })
        result.platforms.push({ platform: 'Google Drive', success: true, fileCount: gdriveResult.files.length })
        result.details.googleDrive = { fileCount: gdriveResult.files.length }
      }
    } catch (e: any) {
      console.error('Google Drive error:', e)
      result.errors.push({ platform: 'Google Drive', error: e.message })
    }

    // Meta Ads (using Graph API token)
    console.log('💰 Fetching Meta Ads data...')
    try {
      const metaToken = await getApiKey(userId, 'meta_graph')
      if (metaToken) {
        const campaigns: any[] = []
        let totalSpend = 0

        for (const account of META_ADS_ACCOUNTS) {
          const res = await fetch(`${META_API_BASE}/${account.id}/campaigns?fields=id,name,status,spend&access_token=${metaToken}`)
          if (res.ok) {
            const data = await res.json()
            for (const c of data.data || []) {
              campaigns.push({
                accountId: account.id,
                accountName: account.name,
                name: c.name,
                status: c.status,
                spend: parseFloat(c.spend || '0')
              })
              totalSpend += parseFloat(c.spend || '0')
            }
          }
        }

        await prisma.dashboardSettings.upsert({
          where: { id: 'metaAds' },
          update: { metaAdsData: JSON.stringify({ campaigns, totalSpend }) },
          create: { id: 'metaAds', userId: userId, metaAdsData: JSON.stringify({ campaigns, totalSpend }) }
        })

        result.platforms.push({ platform: 'Meta Ads', success: true, campaigns: campaigns.length, totalSpend })
        result.details.metaAds = { campaigns: campaigns.length, totalSpend }
      } else {
        result.errors.push({ platform: 'Meta Ads', error: 'No token configured' })
      }
    } catch (e: any) {
      console.error('Meta Ads error:', e)
      result.errors.push({ platform: 'Meta Ads', error: e.message })
    }

    result.success = result.platforms.length > 0
    result.durationMs = Date.now() - startTime

    console.log('\n=== Sync Result ===')
    console.log(JSON.stringify(result, null, 2))

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      durationMs: Date.now() - startTime
    }, { status: 500 })
  }
}
