import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getApiKey } from '@/lib/api-key-store'
import prisma from '@/lib/prisma'

// Schedule folder ID - will be created/used
const SCHEDULE_FOLDER_NAME = 'Schedule'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const userEmail = session.user.email
    const isAdmin = userEmail.toLowerCase() === 'kontenval.id@gmail.com'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const userId = session.user.id || session.user.email
    const apiKey = await getApiKey(userId, 'composio')
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Composio API key not found' }, { status: 400 })
    }

    // Find Schedule folder
    const folderId = await findScheduleFolder(apiKey)
    
    if (!folderId) {
      return NextResponse.json({ 
        success: true, 
        message: 'Schedule folder not found, nothing to delete',
        deleted: 0 
      })
    }

    // Get all files in Schedule folder
    const files = await listFilesInFolder(apiKey, folderId)
    
    // Delete each file
    let deleted = 0
    for (const file of files) {
      try {
        await deleteFile(apiKey, file.id)
        deleted++
      } catch (e) {
        console.warn(`Failed to delete file ${file.name}:`, e)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted} files from Schedule folder`,
      deleted
    })

  } catch (error) {
    console.error('Delete schedule files error:', error)
    return NextResponse.json({ error: 'Failed to delete files' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const userEmail = session.user.email
    const isAdmin = userEmail.toLowerCase() === 'kontenval.id@gmail.com'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const userId = session.user.id || session.user.email
    const apiKey = await getApiKey(userId, 'composio')
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Composio API key not found' }, { status: 400 })
    }

    // Find or create Schedule folder
    let folderId = await findScheduleFolder(apiKey)
    
    if (!folderId) {
      folderId = await createScheduleFolder(apiKey)
    }

    // Create new spreadsheet "Carousel 2026"
    const spreadsheetId = await createSpreadsheet(apiKey, folderId, 'Carousel 2026')
    
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Failed to create spreadsheet' }, { status: 500 })
    }

    // Create sheet for current month (YYYYMM format)
    const now = new Date()
    const sheetName = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    
    // Add sheet to spreadsheet
    await addSheetToSpreadsheet(apiKey, spreadsheetId, sheetName)
    
    // Add header row
    await addHeaderRow(apiKey, spreadsheetId, sheetName)
    
    // Add sample content for this month
    const sampleData = generateSampleContent(now.getFullYear(), now.getMonth() + 1)
    await addContentRows(apiKey, spreadsheetId, sheetName, sampleData)

    return NextResponse.json({
      success: true,
      message: `Created Carousel 2026 with sheet ${sheetName}`,
      spreadsheetId,
      sheetName,
      folderLink: `https://drive.google.com/drive/folders/${folderId}`,
      spreadsheetLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    })

  } catch (error) {
    console.error('Create schedule spreadsheet error:', error)
    return NextResponse.json({ error: 'Failed to create spreadsheet' }, { status: 500 })
  }
}

async function findScheduleFolder(apiKey: string): Promise<string | null> {
  // Search for Schedule folder
  const response = await fetch('https://backend.composio.dev/api/v3.1/tools/execute/GOOGLEDRIVE_FIND_FILE', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'me',
      arguments: {
        q: `name contains 'Schedule' and mimeType = 'application/vnd.google-apps.folder'`,
        fields: "files(id,name)",
        pageSize: 10
      }
    })
  })

  if (!response.ok) return null
  
  const data = await response.json()
  const files = data.data?.files || data.files || []
  
  const scheduleFolder = files.find((f: any) => f.name === 'Schedule')
  return scheduleFolder?.id || null
}

async function createScheduleFolder(apiKey: string): Promise<string> {
  // Create Schedule folder in Composio folder
  const response = await fetch('https://backend.composio.dev/api/v3.1/tools/execute/GOOGLEDRIVE_CREATE_FOLDER', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'me',
      arguments: {
        name: 'Schedule',
        parentFolderId: '1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF' // Composio folder
      }
    })
  })

  if (!response.ok) throw new Error('Failed to create Schedule folder')
  
  const data = await response.json()
  return data.data?.id || data.id
}

async function listFilesInFolder(apiKey: string, folderId: string): Promise<any[]> {
  const response = await fetch('https://backend.composio.dev/api/v3.1/tools/execute/GOOGLEDRIVE_FIND_FILE', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'me',
      arguments: {
        q: ` '${folderId}' in parents and trashed = false`,
        fields: "files(id,name,mimeType)",
        pageSize: 100
      }
    })
  })

  if (!response.ok) return []
  
  const data = await response.json()
  return data.data?.files || data.files || []
}

async function deleteFile(apiKey: string, fileId: string): Promise<void> {
  await fetch('https://backend.composio.dev/api/v3.1/tools/execute/GOOGLEDRIVE_DELETE_FILE', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'me',
      arguments: { fileId }
    })
  })
}

async function createSpreadsheet(apiKey: string, folderId: string, name: string): Promise<string | null> {
  const response = await fetch('https://backend.composio.dev/api/v3.1/tools/execute/GOOGLEDRIVE_CREATE_DOCUMENT', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'me',
      arguments: {
        name,
        type: 'spreadsheet',
        parentFolderId: folderId
      }
    })
  })

  if (!response.ok) return null
  
  const data = await response.json()
  return data.data?.id || data.id
}

async function addSheetToSpreadsheet(apiKey: string, spreadsheetId: string, sheetName: string): Promise<void> {
  // Using Google Sheets API to add sheet
  // First get spreadsheet to access it
  await fetch('https://backend.composio.dev/api/v3.1/tools/execute/GOOGLESHEETS_CREATE_SHEET', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'me',
      arguments: {
        spreadsheetId,
        title: sheetName
      }
    })
  })
}

async function addHeaderRow(apiKey: string, spreadsheetId: string, sheetName: string): Promise<void> {
  const headers = [
    'Date',
    'Day',
    'Topic',
    'Category',
    'Caption',
    'Image Theme',
    'Slide 1',
    'Slide 2',
    'Slide 3',
    'Status'
  ]

  await fetch('https://backend.composio.dev/api/v3.1/tools/execute/GOOGLESHEETS_UPDATE_CELL', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'me',
      arguments: {
        spreadsheetId,
        range: `${sheetName}!A1:J1`,
        values: [headers]
      }
    })
  })
}

async function addContentRows(apiKey: string, spreadsheetId: string, sheetName: string, data: any[]): Promise<void> {
  if (data.length === 0) return

  const values = data.map(row => [
    row.date,
    row.day,
    row.topic,
    row.category,
    row.caption,
    row.imageTheme,
    row.slide1,
    row.slide2,
    row.slide3,
    row.status
  ])

  await fetch('https://backend.composio.dev/api/v3.1/tools/execute/GOOGLESHEETS_UPDATE_CELL', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'me',
      arguments: {
        spreadsheetId,
        range: `${sheetName}!A2:J${data.length + 1}`,
        values
      }
    })
  })
}

function generateSampleContent(year: number, month: number): { date: string; day: string; topic: string; category: string; caption: string; imageTheme: string; slide1: string; slide2: string; slide3: string; status: string; }[] {
  const topics = [
    { topic: 'AI Agents 101', category: 'AI Tips', caption: 'Kenalan dengan AI Agents yang akan mengubah cara kerja kamu! 🤖 #AI #Tech' },
    { topic: 'ChatGPT Tricks', category: 'AI Hack', caption: '5 ChatGPT tricks yang jarang orang tau! 💡 #ChatGPT #Productivity' },
    { topic: 'Midjourney v7', category: 'AI Tips', caption: 'Midjourney v7 keluar! Ini fitur barunya 🎨 #Midjourney #AIArt' },
    { topic: 'Gemini Advanced', category: 'AI Tips', caption: 'Gemini Advanced vs ChatGPT Plus, mana lebih baik? 🔥 #Gemini #AI' },
    { topic: 'Claude 4 Released', category: 'AI Hack', caption: 'Claude 4 baru aja release! Ini yang kamu perlu tau 👀 #Claude #Anthropic' }
  ]

  const daysInMonth = new Date(year, month, 0).getDate()
  const content: { date: string; day: string; topic: string; category: string; caption: string; imageTheme: string; slide1: string; slide2: string; slide3: string; status: string; }[] = []
  
  // Generate ~4 posts per month
  const postingDays = [5, 12, 19, 26]
  
  postingDays.forEach((day, index) => {
    if (day <= daysInMonth) {
      const date = new Date(year, month - 1, day)
      const topic = topics[index % topics.length]
      
      content.push({
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        topic: topic.topic,
        category: topic.category,
        caption: topic.caption,
        imageTheme: `Modern tech aesthetic, ${topic.topic} illustration`,
        slide1: `Title slide: ${topic.topic}`,
        slide2: `Key point 1: Main feature explanation`,
        slide3: `CTA: Follow for more AI tips!`,
        status: 'Planned'
      })
    }
  })

  return content
}
