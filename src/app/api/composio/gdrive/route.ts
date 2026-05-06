import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getConsumerApiKey } from '@/lib/composio-store'
import { getDashboardSettings } from '@/app/api/settings/route'

// Default GDrive folder ID (used for display link only)
const DEFAULT_GDRIVE_FOLDER_ID = '1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email || 'demo@kontenvalid.com'
    
    // Get API key from store
    const apiKey = getConsumerApiKey(userEmail) || process.env.COMPOSIO_API_KEY
    
    // Get dynamic folder ID from settings
    const settings = getDashboardSettings()
    const folderId = settings.gdriveFolderId || DEFAULT_GDRIVE_FOLDER_ID
    const folderName = settings.gdriveFolderName || 'Ebook'

    // Try to fetch from Composio
    let files: any[] = []
    let connected = false

    if (apiKey) {
      try {
        // Search from root My Drive (all files, not just in folder)
        const result = await fetchFromComposio(apiKey)
        
        if (result.files && result.files.length > 0) {
          // Filter for digital product files (exclude folders and certain files)
          files = result.files.filter((f: any) => {
            // Exclude folders
            if (f.mimeType?.includes('folder')) return false
            // Exclude video files
            if (f.mimeType?.includes('video')) return false
            // Exclude image files (profile pictures etc)
            if (f.mimeType?.includes('image') && f.name?.toLowerCase().includes('profile')) return false
            // Include documents, spreadsheets, PDFs
            return true
          })
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
          id: folderId,
          name: folderName,
          link: `https://drive.google.com/drive/folders/${folderId}`
        },
        files: [],
        summary: {
          totalFiles: 0,
          totalSize: 0,
          pdfCount: 0,
          docCount: 0
        },
        message: 'No digital products found. Add files to Google Drive.'
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
        id: folderId,
        name: folderName,
        link: `https://drive.google.com/drive/folders/${folderId}`
      },
      files,
      summary: {
        totalFiles: files.length,
        totalSize: files.reduce((acc: number, f: any) => acc + (f.size || 0), 0),
        pdfCount: files.filter((f: any) => f.mimeType?.includes('pdf')).length,
        docCount: files.filter((f: any) => f.mimeType?.includes('document') || f.mimeType?.includes('word')).length
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

async function fetchFromComposio(apiKey: string) {
  // Call Composio Google Drive tool - search all files from root My Drive
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
        q: "trashed = false",
        fields: "files(id,name,mimeType,size,modifiedTime,webViewLink)",
        orderBy: "modifiedTime desc",
        pageSize: 100
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Composio API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data || data
}
