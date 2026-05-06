// Shared state for Meta Access Token - DEPRECATED
// Now uses database (api-key-store.ts) for multi-user support
// This file is kept for backwards compatibility only

const metaAccessTokens = new Map<string, string>();

export function getMetaAccessToken(userEmail: string): string | undefined {
  // DEPRECATED: Only for backwards compatibility during migration
  // New code should use getApiKey(userId, 'meta_graph') from api-key-store.ts
  console.warn('DEPRECATED: getMetaAccessToken should not be used. Use api-key-store.ts instead.');
  return metaAccessTokens.get(userEmail);
}

export function setMetaAccessToken(userEmail: string, token: string): void {
  // DEPRECATED: Only for backwards compatibility during migration
  console.warn('DEPRECATED: setMetaAccessToken should not be used. Use api-key-store.ts instead.');
  metaAccessTokens.set(userEmail, token);
}

export function deleteMetaAccessToken(userEmail: string): boolean {
  return metaAccessTokens.delete(userEmail);
}
