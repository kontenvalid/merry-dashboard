/**
 * Daily Carousel Generator Cron - Generate & Upload Carousel Images
 * Runs: Every day at 08:00 WIB (01:00 UTC)
 * 
 * What it does:
 * 1. Check GSheet Schedule for tomorrow's posting
 * 2. Generate carousel HTML template
 * 3. Convert to PNG image
 * 4. Upload to Google Drive "Carousel" folder
 * 5. Update GSheet status: "Image Ready"
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getApiKey } from '@/lib/api-key-store'

const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'

// Simple MCP client
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
    
    if (text.startsWith('event:')) {
      const jsonPart = text.split('\n').find(line => line.startsWith('data:'))
      if (jsonPart) return JSON.parse(jsonPart.substring(5))
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
      current_step: 'DAILY_CAROUSEL',
      thought: `Carousel: ${toolSlug}`,
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

// Get tomorrow's schedule from Google Sheets
async function getTomorrowSchedule(apiKey: string): Promise<any[]> {
  const sheetsResult = await executeTool(apiKey, 'GOOGLESHEETS_GET_SHEET_DATA', {
    spreadsheet_id: process.env.GOOGLE_SHEETS_ID || '',
    range: 'Schedule!A1:Z100'
  })

  if (!sheetsResult?.values) {
    console.log('No schedule data found')
    return []
  }

  // Get tomorrow's date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDay = tomorrow.getDate().toString()
  const tomorrowMonth = (tomorrow.getMonth() + 1).toString()
  const tomorrowYear = tomorrow.getFullYear().toString()

  const rows = sheetsResult.values
  const scheduleRows: any[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const dateCol = row[0] || ''

    // Match date patterns: "May 10" or "2026-05-10" or "10/5/2026"
    const dateStr = dateCol.toString()
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const isMatch = 
      dateStr.includes(tomorrowDay) && 
      (dateStr.includes(tomorrowMonth) || dateStr.includes(monthNames[tomorrow.getMonth()]))
    
    if (isMatch) {
      scheduleRows.push({
        rowIndex: i + 1,
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

// Get or create Google Drive "Carousel" folder
async function getCarouselFolder(apiKey: string): Promise<string | null> {
  const CAROUSEL_FOLDER_NAME = 'Carousel'
  const CAROUSEL_FOLDER_ID = process.env.GOOGLE_DRIVE_CAROUSEL_FOLDER_ID

  // Return cached folder ID if set
  if (CAROUSEL_FOLDER_ID) {
    return CAROUSEL_FOLDER_ID
  }

  // Search for existing folder
  const searchResult = await executeTool(apiKey, 'GOOGLEDRIVE_LIST_DRIVE_FILES', {
    page_size: 100,
    q: `name='${CAROUSEL_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'`
  })

  const folders = searchResult?.files || []
  if (folders.length > 0) {
    console.log(`Found existing Carousel folder: ${folders[0].id}`)
    return folders[0].id
  }

  // Create new folder
  const createResult = await executeTool(apiKey, 'GOOGLEDRIVE_CREATE_FOLDER', {
    name: CAROUSEL_FOLDER_NAME,
    parent_folder_id: process.env.GOOGLE_DRIVE_PARENT_ID || ''
  })

  if (createResult?.id) {
    console.log(`Created new Carousel folder: ${createResult.id}`)
    return createResult.id
  }

  return null
}

// Generate carousel HTML template
async function generateCarouselHtml(topic: string, slides: any[]): Promise<string> {
  // Modern gradient carousel template
  const slidesHtml = slides.map((slide, index) => `
    <div class="slide" data-slide="${index + 1}">
      <div class="slide-number">${index + 1}/${slides.length}</div>
      <div class="slide-content">
        ${slide.title ? `<h2>${slide.title}</h2>` : ''}
        ${slide.text ? `<p>${slide.text}</p>` : ''}
        ${slide.list ? `
          <ul>
            ${slide.list.map((item: string) => `<li>${item}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
      ${slide.image ? `<div class="slide-image" style="background-image: url('${slide.image}')"></div>` : ''}
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topic} - Social Carousel</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, sans-serif; 
      background: #0a0a0a;
      color: white;
    }
    .carousel {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }
    .slide {
      min-width: 100vw;
      height: 100vh;
      scroll-snap-align: start;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }
    
    /* Gradient backgrounds per slide */
    .slide:nth-child(1) { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .slide:nth-child(2) { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    .slide:nth-child(3) { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
    .slide:nth-child(4) { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
    .slide:nth-child(5) { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
    
    .slide-number {
      position: absolute;
      top: 30px;
      right: 40px;
      font-size: 18px;
      font-weight: 600;
      opacity: 0.7;
    }
    .slide-content {
      max-width: 800px;
      text-align: center;
      z-index: 10;
    }
    .slide-content h2 {
      font-size: 72px;
      font-weight: 800;
      margin-bottom: 30px;
      line-height: 1.1;
      text-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .slide-content p {
      font-size: 32px;
      line-height: 1.5;
      opacity: 0.95;
    }
    .slide-content ul {
      list-style: none;
      margin-top: 30px;
    }
    .slide-content li {
      font-size: 28px;
      margin: 15px 0;
      padding-left: 40px;
      position: relative;
    }
    .slide-content li::before {
      content: '✓';
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    .slide-image {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.2;
    }
    .brand-watermark {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 14px;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="carousel">
    ${slidesHtml}
  </div>
  <div class="brand-watermark">Generated by Merry Dashboard</div>
</body>
</html>
  `.trim()
}

// Convert HTML to PNG using html-to-image tool
async function htmlToImage(
  apiKey: string,
  html: string,
  filename: string
): Promise<string | null> {
  // Try html-to-image tool
  const result = await executeTool(apiKey, 'HTML_TO_IMAGE_GENERATE_SCREENSHOT', {
    html: html,
    viewport: { width: 1080, height: 1080 },
    filename: filename
  })

  if (result?.image_url || result?.url || result?.screenshot_url) {
    return result.image_url || result.url || result.screenshot_url
  }

  return null
}

// Alternative: Generate simple PNG directly
async function generateSimpleImage(
  apiKey: string,
  topic: string,
  slideIndex: number
): Promise<string | null> {
  // Use AI image generation as fallback
  const prompt = `Instagram carousel slide ${slideIndex} for topic: ${topic}. Modern design, gradient background, bold typography, 1080x1080px, high quality social media post style`

  const result = await executeTool(apiKey, 'IMAGEGENERATIONGENERATE_IMAGES', {
    prompt: prompt,
    aspect_ratio: '1:1',
    output_format: 'png',
    quality: 'high',
    resolution: '1K'
  })

  if (result?.images?.[0]?.url) {
    return result.images[0].url
  }

  return null
}

// Upload image to Google Drive
async function uploadToDrive(
  apiKey: string,
  folderId: string,
  filename: string,
  imageUrl: string
): Promise<string | null> {
  // Download image first
  const imageResponse = await fetch(imageUrl)
  const imageBuffer = await imageResponse.arrayBuffer()

  // Upload to Google Drive
  const uploadResult = await executeTool(apiKey, 'GOOGLEDRIVE_UPLOAD_FILE', {
    name: filename,
    parent_folder_id: folderId,
    mime_type: 'image/png'
  })

  if (uploadResult?.id) {
    return uploadResult.webViewLink || uploadResult.alternateLink
  }

  return null
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

// Update schedule status to "Image Ready"
async function updateScheduleStatus(
  apiKey: string,
  rowIndex: number,
  driveLink: string
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || ''
  
  // Update status
  await updateSheetCell(apiKey, spreadsheetId, `D${rowIndex}`, 'Image Ready')
  
  // Add drive link to notes
  const existingNotes = ''
  await updateSheetCell(
    apiKey, 
    spreadsheetId, 
    `E${rowIndex}`, 
    `${existingNotes}\nImage: ${driveLink}`.trim()
  )
}

export async function GET() {
  const startTime = Date.now()
  const result: any = {
    success: false,
    executedAt: new Date().toISOString(),
    durationMs: 0,
    itemsProcessed: 0,
    imagesGenerated: 0,
    errors: []
  }

  try {
    const userId = 'cmopvdcrn00004e1xbsct0hbq' // TODO: Get from auth context
    const composioKey = await getApiKey(userId, 'composio')

    if (!composioKey) {
      return NextResponse.json({
        success: false,
        error: 'Composio API key not found',
        message: 'Please configure Composio API key in Settings'
      }, { status: 400 })
    }

    console.log('🎨 Starting Daily Carousel Generation...')
    console.log(`   Time: ${new Date().toISOString()}`)

    // Step 1: Get tomorrow's schedule
    console.log('\n📅 Step 1: Checking tomorrow schedule...')
    let scheduleItems = []
    try {
      scheduleItems = await getTomorrowSchedule(composioKey)
      console.log(`   Found ${scheduleItems.length} items for tomorrow`)
    } catch (e: any) {
      console.error('   Schedule error:', e.message)
      result.errors.push({ step: 'schedule', error: e.message })
    }

    if (scheduleItems.length === 0) {
      console.log('   No schedule items for tomorrow, skipping carousel generation')
      return NextResponse.json({
        success: true,
        message: 'No schedule items for tomorrow',
        itemsProcessed: 0
      })
    }

    // Step 2: Get or create Carousel folder
    console.log('\n📁 Step 2: Getting Carousel folder...')
    const folderId = await getCarouselFolder(composioKey)
    if (!folderId) {
      console.error('   Could not get/create Carousel folder')
      result.errors.push({ step: 'folder', error: 'Could not access Google Drive folder' })
    }

    // Step 3: Generate carousel for each schedule item
    console.log('\n🎨 Step 3: Generating carousel images...')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    for (const item of scheduleItems) {
      console.log(`\n   Processing: "${item.topic}"`)
      
      try {
        // Create slides data
        const slides = [
          {
            title: item.topic,
            text: 'Slide 1 content here',
            list: ['Point 1', 'Point 2', 'Point 3']
          },
          {
            title: 'Key Insight',
            text: 'Main takeaway from this topic'
          },
          {
            title: 'Action Steps',
            list: ['Step 1', 'Step 2', 'Step 3']
          },
          {
            title: item.topic,
            text: 'Call to action or closing'
          }
        ]

        // Generate HTML carousel
        const html = await generateCarouselHtml(item.topic, slides)
        
        // Generate filename
        const filename = `carousel-${item.platform}-${dateStr}-${Date.now()}.png`
          .toLowerCase()
          .replace(/\s+/g, '-')

        // Convert to image (using html-to-image tool)
        let imageUrl: string | null = null
        
        try {
          // Method 1: Try html-to-image
          imageUrl = await htmlToImage(composioKey, html, filename)
        } catch (e) {
          console.log('   html-to-image failed, trying AI generation...')
        }

        if (!imageUrl) {
          // Method 2: Generate simple images using AI
          for (let i = 1; i <= slides.length; i++) {
            const slideUrl = await generateSimpleImage(
              composioKey,
              `${item.topic} - Slide ${i}`,
              i
            )
            if (slideUrl) {
              console.log(`   ✅ Slide ${i} generated`)
              result.imagesGenerated++
            }
          }
        } else {
          console.log(`   ✅ Carousel generated: ${imageUrl}`)
          result.imagesGenerated++

          // Upload to Drive
          if (folderId) {
            const driveLink = await uploadToDrive(
              composioKey,
              folderId,
              filename,
              imageUrl
            )

            if (driveLink) {
              console.log(`   ✅ Uploaded to Drive: ${driveLink}`)
              
              // Update schedule status
              await updateScheduleStatus(composioKey, item.rowIndex, driveLink)
              console.log(`   ✅ Status updated to "Image Ready"`)
            }
          }
        }

        result.itemsProcessed++
      } catch (e: any) {
        console.error(`   Error generating carousel:`, e.message)
        result.errors.push({ 
          item: item.topic, 
          error: e.message 
        })
      }
    }

    result.success = result.itemsProcessed > 0
    result.durationMs = Date.now() - startTime

    console.log('\n=== Daily Carousel Complete ===')
    console.log(`Success: ${result.success}`)
    console.log(`Items processed: ${result.itemsProcessed}`)
    console.log(`Images generated: ${result.imagesGenerated}`)
    console.log(`Errors: ${result.errors.length}`)
    console.log(`Duration: ${result.durationMs}ms`)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Daily Carousel error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      durationMs: Date.now() - startTime
    }, { status: 500 })
  }
}