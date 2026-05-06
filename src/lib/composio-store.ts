// Composio API Key store - DEPRECATED
// Now uses database (api-key-store.ts) for multi-user support
// This file is kept for backwards compatibility only

const consumerApiKeys = new Map<string, string>();

export function setConsumerApiKey(userEmail: string, apiKey: string): void {
  // DEPRECATED: Only for backwards compatibility during migration
  console.warn('DEPRECATED: setConsumerApiKey should not be used. Use api-key-store.ts instead.');
  consumerApiKeys.set(userEmail, apiKey)
}

export function getConsumerApiKey(userEmail: string): string | undefined {
  // DEPRECATED: Only for backwards compatibility during migration
  console.warn('DEPRECATED: getConsumerApiKey should not be used. Use api-key-store.ts instead.');
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
