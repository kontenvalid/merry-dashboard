import prisma from './prisma'

// Simple encryption (in production, use proper encryption like AES-256)
// For demo: base64 encoding with a salt - NOT SECURE for production!
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT || 'merry-dashboard-salt-2024'

function encodeKey(key: string): string {
  // In production, use proper encryption like:
  // import crypto from 'crypto'
  // crypto.createCipher('aes-256-cbc', ENCRYPTION_SALT)
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

// Get API key from database
export async function getApiKey(userId: string, service: string): Promise<string | null> {
  const record = await prisma.apiKey.findUnique({
    where: {
      userId_service: { userId, service }
    }
  })
  
  if (!record || !record.isActive) return null
  
  try {
    return decodeKey(record.apiKey)
  } catch {
    return null
  }
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

// List all API keys (without the actual key values)
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