import { NextResponse } from 'next/server'

export async function GET() {
  // Google Drive - Composio/Ebook folder
  const data = {
    connected: true,
    folder: {
      id: '1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF',
      name: 'Ebook',
      link: 'https://drive.google.com/drive/folders/1iTAz2sMPMJro0svMXcrDrGJGZAu8ixCF'
    },
    files: [
      {
        id: 'file_1',
        name: 'Panduan Affiliate Marketing.pdf',
        mimeType: 'application/pdf',
        size: 2500000,
        modifiedTime: '2026-05-01T10:00:00+0000',
        webViewLink: 'https://drive.google.com/file/d/file_1/view'
      },
      {
        id: 'file_2',
        name: 'Digital Product Blueprint.pdf',
        mimeType: 'application/pdf',
        size: 3800000,
        modifiedTime: '2026-04-28T14:30:00+0000',
        webViewLink: 'https://drive.google.com/file/d/file_2/view'
      },
      {
        id: 'file_3',
        name: 'Email Marketing Template.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 520000,
        modifiedTime: '2026-04-25T09:00:00+0000',
        webViewLink: 'https://drive.google.com/file/d/file_3/view'
      }
    ],
    summary: {
      totalFiles: 3,
      totalSize: 6820000,
      pdfCount: 2,
      docCount: 1
    }
  }
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}
