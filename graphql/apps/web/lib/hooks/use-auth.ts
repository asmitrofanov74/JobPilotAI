import { useMutation } from '@tanstack/react-query';
import { client, setAuthToken } from '@/lib/graphql/client';
import { useAuthStore } from '@/lib/auth-store';
import { LOGIN_MUTATION, REGISTER_MUTATION } from '@/lib/graphql';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { login } = await client.request(LOGIN_MUTATION, { input });
      return login;
    },
    onSuccess: (data) => {
      setAuthToken(data.accessToken);
      setAuth(data.accessToken, data.refreshToken, data.user);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { register } = await client.request(REGISTER_MUTATION, { input });
      return register;
    },
    onSuccess: (data) => {
      setAuthToken(data.accessToken);
      setAuth(data.accessToken, data.refreshToken, data.user);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return () => {
    setAuthToken(null);
    clearAuth();
  };
}
