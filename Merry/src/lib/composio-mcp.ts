// Stub - composio-mcp functionality moved to sync/route.ts
// This file exists to satisfy imports but actual logic is in sync/route.ts

export async function fetchAllSocialData(apiKey: string, date?: Date) {
  return { facebook: null, instagram: null, youtube: null }
}

export async function fetchGoogleDriveFiles(apiKey: string, folderId?: string) {
  return { files: [], folder: null }
}

export async function testMcpConnection(apiKey: string) {
  return { connected: false, error: 'Functionality moved to sync route' }
}

export const MCP_ENDPOINT = 'https://connect.composio.dev/mcp'