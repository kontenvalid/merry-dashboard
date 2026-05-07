import prisma from './prisma'

// API keys from env (fallback if DB keys are not set)
const FALLBACK_COMPOSIO_KEY = process.env.COMPOSIO_API_KEY || 'ck_81LPoF-vaCnWO8LTJ1nF'
const FALLBACK_META_TOKEN = process.env.META_ACCESS_TOKEN || ''

// Simple encoding for storage
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT || 'merry-dashboard-salt-2024'

function encodeKey(key: string): string {
  return Buffer.from(key).toString('base64')
}

function decodeKey(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf8')
}

// Save API key to database
export async function saveApiKey(userId: string, service: string, apiKey: string, metadata?: any) {
  const encoded = encodeKey(apiKey)
  
  return prisma.apiKey.upsert({
    where: {
      userId_service: { userId, service }
    },
    update: {
      apiKey: encoded,
      metadata: metadata || null,
      updatedAt: new Date()
    },
    create: {
      userId,
      service,
      apiKey: encoded,
      metadata: metadata || null,
      isActive: true
    }
  })
}

// Get API key from database, fallback to env vars
export async function getApiKey(userId: string, service: string): Promise<string | null> {
  // First try database
  const record = await prisma.apiKey.findUnique({
    where: {
      userId_service: { userId, service }
    }
  })
  
  if (record?.isActive && record.apiKey) {
    try {
      return decodeKey(record.apiKey)
    } catch {
      // Fall through to env
    }
  }
  
  // Fallback to env vars
  if (service === 'composio' && FALLBACK_COMPOSIO_KEY) {
    console.log('Using fallback Composio key from env')
    return FALLBACK_COMPOSIO_KEY
  }
  
  if (service === 'meta_graph' && FALLBACK_META_TOKEN) {
    console.log('Using fallback Meta token from env')
    return FALLBACK_META_TOKEN
  }
  
  return null
}

// Delete API key
export async function deleteApiKey(userId: string, service: string): Promise<boolean> {
  const result = await prisma.apiKey.update({
    where: {
      userId_service: { userId, service }
    },
    data: { isActive: false }
  })
  
  return !!result
}

// List all API keys (without actual key values)
export async function listApiKeys(userId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { userId, isActive: true },
    select: { service: true, metadata: true, createdAt: true, updatedAt: true }
  })
  
  return keys.map(k => ({
    service: k.service,
    hasKey: true,
    metadata: k.metadata,
    createdAt: k.createdAt,
    updatedAt: k.updatedAt
  }))
}

// Check if API key exists
export async function hasApiKey(userId: string, service: string): Promise<boolean> {
  const record = await prisma.apiKey.findUnique({
    where: { userId_service: { userId, service } }
  })
  return !!record?.isActive
}