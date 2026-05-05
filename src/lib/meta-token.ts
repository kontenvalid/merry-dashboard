// Shared state for Meta Access Token
// In production, use database with encryption

const metaAccessTokens = new Map<string, string>();

export function getMetaAccessToken(userEmail: string): string | undefined {
  return metaAccessTokens.get(userEmail) || process.env.META_ACCESS_TOKEN;
}

export function setMetaAccessToken(userEmail: string, token: string): void {
  metaAccessTokens.set(userEmail, token);
}

export function deleteMetaAccessToken(userEmail: string): boolean {
  return metaAccessTokens.delete(userEmail);
}