// In-memory store for consumer API keys
// In production, use encrypted database storage
const consumerApiKeys = new Map<string, string>()

export function setConsumerApiKey(userEmail: string, apiKey: string): void {
  // In production, encrypt before storing!
  consumerApiKeys.set(userEmail, apiKey)
}

export function getConsumerApiKey(userEmail: string): string | undefined {
  return consumerApiKeys.get(userEmail)
}

export function deleteConsumerApiKey(userEmail: string): boolean {
  return consumerApiKeys.delete(userEmail)
}

export function hasConsumerApiKey(userEmail: string): boolean {
  return consumerApiKeys.has(userEmail)
}

export function getAllUsers(): string[] {
  return Array.from(consumerApiKeys.keys())
}