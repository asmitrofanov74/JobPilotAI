import { GraphQLClient } from 'graphql-request';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

function buildHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const client = new GraphQLClient(API_URL, {
  headers: buildHeaders,
  credentials: 'include',
});

export function setAuthToken(token: string | null) {
  client.setHeader('Authorization', token ? `Bearer ${token}` : '');
}
