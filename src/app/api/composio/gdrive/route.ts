import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getConsumerApiKey } from '@/lib/composio-store'

const GD_FOLDER_ID = '1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email || 'demo@kontenvalid.com'
    
    // Get API key from store
    const apiKey = getConsumerApiKey(userEmail) || process.env.COMPOSIO_API_KEY

    // Try to fetch from Composio
    let files: any[] = []
    let connected = false

    if (apiKey) {
      try {
        const result = await fetchFromComposio(apiKey, GD_FOLDER_ID)
        if (result.files && result.files.length > 0) {
          files = result.files
          connected = true
        }
      } catch (e) {
        console.warn('Google Drive fetch via Composio failed:', e)
      }
    }

    // If no real data, return empty state
    if (!connected || files.length === 0) {
      return NextResponse.json({
        connected: false,
        folder: {
          id: GD_FOLDER_ID,
          name: 'Ebook',
          link: `https://drive.google.com/drive/folders/${GD_FOLDER_ID}`
        },
        files: [],
        summary: {
          totalFiles: 0,
          totalSize: 0,
          pdfCount: 0,
          docCount: 0
        },
        message: 'Google Drive folder is empty or not connected. Upload files to Composio/Ebook folder in Google Drive.'
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      })
    }

    // Return real data
    return NextResponse.json({
      connected: true,
      folder: {
        id: GD_FOLDER_ID,
        name: 'Ebook',
        link: `https://drive.google.com/drive/folders/${GD_FOLDER_ID}`
      },
      files,
      summary: {
        totalFiles: files.length,
        totalSize: files.reduce((acc, f) => acc + (f.size || 0), 0),
        pdfCount: files.filter(f => f.mimeType?.includes('pdf')).length,
        docCount: files.filter(f => !f.mimeType?.includes('pdf')).length
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Google Drive sync error:', error)
    return NextResponse.json({
      connected: false,
      error: 'Failed to sync Google Drive',
      files: []
    }, { status: 500 })
  }
}

async function fetchFromComposio(apiKey: string, folderId: string) {
  // Call Composio Google Drive tool
  const response = await fetch('https://backend.composio.dev/v3/mcp', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'list_google_drive_files',
        arguments: {
          folder_id: folderId,
          order_by: 'modified_time desc'
        }
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Composio API error: ${response.status}`)
  }

  const data = await response.json()
  return data.result || data
}