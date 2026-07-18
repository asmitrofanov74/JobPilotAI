import { GraphQLClient, ClientError } from 'graphql-request';

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

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.refreshToken ?? null;
  } catch {
    return null;
  }
}

export const client = new GraphQLClient(API_URL, {
  headers: { Authorization: getToken() ? `Bearer ${getToken()}` : '' },
  credentials: 'include',
});

export function setAuthToken(token: string | null) {
  client.setHeader('Authorization', token ? `Bearer ${token}` : '');
}

const REFRESH_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

function updateStoredTokens(accessToken: string, refreshToken: string) {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.state.accessToken = accessToken;
      parsed.state.refreshToken = refreshToken;
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    }
  } catch {}
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (isRefreshing) {
    return new Promise((resolve) => {
      pendingRequests.push(() => resolve(true));
    });
  }

  isRefreshing = true;
  try {
    const tempClient = new GraphQLClient(API_URL);
    const result = await tempClient.request<{ refreshToken: { accessToken: string; refreshToken: string } }>(REFRESH_MUTATION, { refreshToken });
    if (result?.refreshToken) {
      setAuthToken(result.refreshToken.accessToken);
      updateStoredTokens(result.refreshToken.accessToken, result.refreshToken.refreshToken);
      pendingRequests.forEach((cb) => cb());
      pendingRequests = [];
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

const originalRequest = client.request.bind(client);

function isAuthError(err: unknown): boolean {
  if (!(err instanceof ClientError)) return false;
  const errors = err.response?.errors;
  if (!errors || !Array.isArray(errors)) return false;
  return errors.some(
    (e: { extensions?: Record<string, unknown>; message?: string }) =>
      e?.extensions?.code === 'UNAUTHENTICATED' ||
      e?.message?.toLowerCase().includes('authentication required') ||
      e?.message?.toLowerCase().includes('unauthorized'),
  );
}

Object.defineProperty(client, 'request', {
  configurable: true,
  writable: true,
  value: async function request<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    try {
      const token = getToken();
      if (token) client.setHeader('Authorization', `Bearer ${token}`);
      return await originalRequest(query, variables) as T;
    } catch (err) {
      if (isAuthError(err)) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          const token = getToken();
          if (token) client.setHeader('Authorization', `Bearer ${token}`);
          return await originalRequest(query, variables) as T;
        }
        try { localStorage.removeItem('auth-storage'); } catch {}
        setAuthToken(null);
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
      throw err;
    }
  },
});
