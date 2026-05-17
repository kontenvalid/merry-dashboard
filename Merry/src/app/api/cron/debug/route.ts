import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Import here to avoid build issues
    const { getApiKey } = await import('@/lib/api-key-store')
    
    const userId = 'kontenval.id@gmail.com'
    
    // Check all API keys
    const apiKey = await getApiKey(userId, 'composio')
    const metaToken = await getApiKey(userId, 'meta_graph')
    
    return NextResponse.json({
      success: true,
      debug: true,
      apiKeys: {
        composio: apiKey ? '✅ Found' : '❌ Missing',
        meta_graph: metaToken ? '✅ Found' : '❌ Missing'
      },
      apiKeyLength: apiKey?.length || 0,
      metaTokenLength: metaToken?.length || 0,
      userId,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}