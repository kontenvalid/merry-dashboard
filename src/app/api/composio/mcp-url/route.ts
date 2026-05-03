import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getConsumerApiKey } from '@/lib/composio-store'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userEmail = session.user.email
  const apiKey = getConsumerApiKey(userEmail) || process.env.COMPOSIO_API_KEY

  if (!apiKey) {
    return NextResponse.json({ 
      error: 'No API key configured',
      hasKey: false 
    }, { status: 400 })
  }

  try {
    // Generate MCP URL using Composio SDK
    // This creates a user-specific MCP server URL
    const { Composio } = await import('@composio/core')
    
    const composio = new Composio({ apiKey })
    
    // Create MCP server config (or use existing)
    const serverConfig = {
      name: 'merry-dashboard-social',
      toolkits: ['facebook', 'instagram', 'youtube', 'meta_ads'],
      allowedTools: [
        // Facebook
        'FACEBOOK_GET_PAGE_INFO',
        'FACEBOOK_GET_PAGE_INSIGHTS',
        'FACEBOOK_GET_POSTS',
        // Instagram  
        'INSTAGRAM_GET_PROFILE',
        'INSTAGRAM_GET_MEDIA',
        'INSTAGRAM_GET_INSIGHTS',
        // YouTube
        'YOUTUBE_GET_CHANNEL_INFO',
        'YOUTUBE_GET_VIDEOS',
        'YOUTUBE_GET_ANALYTICS',
        // Meta Ads
        'METAADS_GET_AD_ACCOUNTS',
        'METAADS_GET_AD_CAMPAIGNS',
        'METAADS_GET_AD_INSIGHTS'
      ]
    }

    // Create or get existing MCP server
    const server = await composio.mcp.create(serverConfig.name, {
      toolkits: serverConfig.toolkits.map(toolkit => ({
        toolkit,
        authConfigId: 'default'
      })),
      allowedTools: serverConfig.allowedTools
    })

    // Generate user-specific MCP URL
    const instance = await composio.mcp.generate(userEmail, server.id)

    return NextResponse.json({
      success: true,
      hasKey: true,
      mcpUrl: instance.url,
      mcpHeaders: {
        'x-api-key': apiKey,
        'x-consumer-api-key': apiKey
      },
      serverId: server.id,
      serverName: server.name,
      instructions: 'Use this URL to connect to Claude Desktop, Cursor, or other MCP clients'
    })
  } catch (error: any) {
    console.error('MCP URL generation error:', error)
    
    // Fallback: return instructions for manual setup
    return NextResponse.json({
      success: false,
      hasKey: true,
      error: 'Failed to generate MCP URL automatically',
      fallback: true,
      manualInstructions: {
        step1: 'Go to https://platform.composio.dev/mcp-configs',
        step2: 'Create a new MCP server with Facebook, Instagram, YouTube, Meta Ads toolkits',
        step3: 'Copy the MCP server URL',
        step4: 'Use the URL with x-api-key header in your MCP client'
      }
    }, { status: 500 })
  }
}