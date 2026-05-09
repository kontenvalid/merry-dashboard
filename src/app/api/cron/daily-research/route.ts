/**
 * Daily Research Cron - AI News Research & Schedule Update
 * Runs: Every day at 07:00 WIB (00:00 UTC)
 * 
 * What it does:
 * 1. Search for latest AI news/developments
 * 2. Update GSheet Schedule with research findings
 * 3. Set status: "Research Done"
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getApiKey } from '@/lib/api-key-store'

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'

// Simple MCP client (same pattern as sync/route.ts)
async function callMcp(apiKey: string, method: string, params: any): Promise<any> {
  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-consumer-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: method,
        params: params
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { error: `HTTP ${response.status}`, details: errorText.substring(0, 200) }
    }

    const text = await response.text()
    
    // Parse SSE format
    if (text.startsWith('event:')) {
      const jsonPart = text.split('\n').find(line => line.startsWith('data:'))
      if (jsonPart) {
        return JSON.parse(jsonPart.substring(5))
      }
    }
    
    return JSON.parse(text)
  } catch (error: any) {
    return { error: error.message }
  }
}

// Execute tool via MCP
async function executeTool(apiKey: string, toolSlug: string, args: any): Promise<any> {
  const result = await callMcp(apiKey, 'tools/call', {
    name: 'COMPOSIO_MULTI_EXECUTE_TOOL',
    arguments: {
      current_step: 'DAILY_RESEARCH',
      thought: `Research: ${toolSlug}`,
      tools: [{ tool_slug: toolSlug, arguments: args }],
      sync_response_to_workbench: false
    }
  })

  if (result.error) {
    console.error(`executeTool ${toolSlug} error:`, result.error)
    return null
  }

  const text = result?.result?.content?.[0]?.text
  if (!text) return null

  try {
    const parsed = JSON.parse(text)
    const results = parsed?.data?.results
    if (results && results.length > 0) {
      return results[0].response?.data || results[0].response
    }
    return parsed
  } catch {
    return text
  }
}

// Search for AI news using web search
async function searchAiNews(apiKey: string): Promise<string[]> {
  // Try to use browser/search tool if available
  const result = await executeTool(apiKey, 'GOOGLESEARCH', {
    query: 'latest AI news 2026 artificial intelligence developments',
    num_results: 5
  })

  if (result?.results) {
    return result.results.map((r: any) => ({
      title: r.title,
      snippet: r.snippet,
      link: r.link
    }))
  }

  // Fallback: try WEB_SEARCH
  const webResult = await executeTool(apiKey, 'WEB_SEARCH', {
    query: 'AI news today May 2026'
  })

  if (webResult) {
    return Array.isArray(webResult) ? webResult : [webResult]
  }

  return []
}

// Get Google Sheet schedule for tomorrow
async function getScheduleForTomorrow(apiKey: string): Promise<any[]> {
  // Get Google Sheets data via MCP
  const sheetsResult = await executeTool(apiKey, 'GOOGLESHEETS_GET_SHEET_DATA', {
    spreadsheet_id: process.env.GOOGLE_SHEETS_ID || '',
    range: 'Schedule!A1:Z100'
  })

  if (!sheetsResult?.values) {
    console.log('No schedule data found')
    return []
  }

  // Parse and find tomorrow's rows
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const rows = sheetsResult.values
  const scheduleRows: any[] = []

  // Skip header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const dateCol = row[0] // Column A: Date

    // Check if date matches tomorrow
    if (dateCol && dateCol.toString().includes(tomorrowStr.split('-')[2])) {
      scheduleRows.push({
        rowIndex: i + 1, // 1-indexed for Sheets API
        date: row[0],
        topic: row[1] || '',
        platform: row[2] || '',
        status: row[3] || 'Pending',
        notes: row[4] || ''
      })
    }
  }

  return scheduleRows
}

// Update Google Sheet cell
async function updateSheetCell(
  apiKey: string,
  spreadsheetId: string,
  cell: string,
  value: string
): Promise<boolean> {
  const result = await executeTool(apiKey, 'GOOGLESHEETS_UPDATE_CELL', {
    spreadsheet_id: spreadsheetId,
    range: `Schedule!${cell}`,
    value: value
  })

  return !!result
}

// Update Google Sheet row with research findings
async function updateScheduleRow(
  apiKey: string,
  spreadsheetId: string,
  rowIndex: number,
  status: string,
  researchNotes: string
): Promise<boolean> {
  // Status column is D, Notes column is E
  const statusCell = `D${rowIndex}`
  const notesCell = `E${rowIndex}`

  await updateSheetCell(apiKey, spreadsheetId, statusCell, status)
  await updateSheetCell(apiKey, spreadsheetId, notesCell, researchNotes)

  return true
}

// Store research findings in database
async function saveResearchToDb(
  topic: string,
  researchText: string,
  status: string
): Promise<void> {
  const today = new Date()
  const utcDate = new Date(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0, 0, 0, 0
  ))

  // Store as dashboard settings JSON for now
  const researchData = {
    topic,
    research: researchText,
    status,
    date: utcDate.toISOString(),
    updatedAt: new Date().toISOString()
  }

  await prisma.dashboardSettings.upsert({
    where: { id: 'dailyResearch' },
    update: { 
      metaAdsData: JSON.stringify(researchData) // Reusing column for JSON storage
    },
    create: { 
      id: 'dailyResearch',
      metaAdsData: JSON.stringify(researchData)
    }
  })
}

export async function GET() {
  const startTime = Date.now()
  const result: any = {
    success: false,
    executedAt: new Date().toISOString(),
    durationMs: 0,
    news: [],
    scheduleItems: 0,
    errors: []
  }

  try {
    // Get Composio API key from database
    const userId = 'cmopvdcrn00004e1xbsct0hbq' // TODO: Get from auth context
    const composioKey = await getApiKey(userId, 'composio')

    if (!composioKey) {
      return NextResponse.json({
        success: false,
        error: 'Composio API key not found',
        message: 'Please configure Composio API key in Settings'
      }, { status: 400 })
    }

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID || ''
    console.log('🔍 Starting Daily Research...')
    console.log(`   Time: ${new Date().toISOString()}`)
    console.log(`   Spreadsheet: ${spreadsheetId || '(not set)'}`)

    // Step 1: Search for AI news
    console.log('\n📰 Step 1: Searching for AI news...')
    try {
      const newsResults = await searchAiNews(composioKey)
      result.news = newsResults.slice(0, 5)
      console.log(`   Found ${newsResults.length} news items`)
    } catch (e: any) {
      console.error('   News search error:', e.message)
      result.errors.push({ step: 'news_search', error: e.message })
    }

    // Step 2: Get schedule for tomorrow
    console.log('\n📅 Step 2: Checking tomorrow schedule...')
    let scheduleItems: any[] = []
    try {
      if (spreadsheetId) {
        scheduleItems = await getScheduleForTomorrow(composioKey)
        result.scheduleItems = scheduleItems.length
        console.log(`   Found ${scheduleItems.length} items for tomorrow`)
      } else {
        console.log('   ⚠️ GOOGLE_SHEETS_ID not set, skipping schedule check')
        result.errors.push({ step: 'schedule_check', error: 'GOOGLE_SHEETS_ID not configured' })
      }
    } catch (e: any) {
      console.error('   Schedule check error:', e.message)
      result.errors.push({ step: 'schedule_check', error: e.message })
    }

    // Step 3: Update schedule status to "Research Done"
    console.log('\n✏️ Step 3: Updating schedule status...')
    try {
      if (scheduleItems.length > 0) {
        const researchSummary = result.news.map((n: any, i: number) => 
          `${i + 1}. ${n.title}: ${n.snippet}`.substring(0, 500)
        ).join('\n')

        for (const item of scheduleItems) {
          await updateScheduleRow(
            composioKey,
            spreadsheetId,
            item.rowIndex,
            'Research Done',
            `AI News: ${researchSummary.substring(0, 1000)}`
          )
          console.log(`   ✅ Updated row ${item.rowIndex}: "${item.topic}"`)
        }
      }
    } catch (e: any) {
      console.error('   Update error:', e.message)
      result.errors.push({ step: 'schedule_update', error: e.message })
    }

    // Step 4: Save to database
    console.log('\n💾 Step 4: Saving research to database...')
    try {
      const combinedResearch = result.news.map((n: any) => 
        `${n.title} - ${n.snippet}`
      ).join(' | ')
      
      await saveResearchToDb(
        scheduleItems[0]?.topic || 'AI News',
        combinedResearch || 'No news found today',
        'Research Done'
      )
      console.log('   ✅ Research saved to database')
    } catch (e: any) {
      console.error('   Database save error:', e.message)
      result.errors.push({ step: 'database_save', error: e.message })
    }

    result.success = true
    result.durationMs = Date.now() - startTime

    console.log('\n=== Daily Research Complete ===')
    console.log(`Success: ${result.success}`)
    console.log(`News items: ${result.news.length}`)
    console.log(`Schedule items: ${result.scheduleItems}`)
    console.log(`Errors: ${result.errors.length}`)
    console.log(`Duration: ${result.durationMs}ms`)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Daily Research error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      durationMs: Date.now() - startTime
    }, { status: 500 })
  }
}