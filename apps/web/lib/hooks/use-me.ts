import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { ME_QUERY } from '@/lib/graphql';
import { useAuthStore } from '@/lib/auth-store';

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const { me } = await client.request(ME_QUERY);
        setUser(me);
        return me;
      } catch {
        clearAuth();
        throw new Error('Not authenticated');
      }
    },
    enabled: isAuthenticated,
    retry: false,
  });
}
