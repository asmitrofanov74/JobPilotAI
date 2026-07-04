import { useAuthStore } from '../auth-store';
import { act } from '@testing-library/react';

beforeEach(() => {
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('AuthStore', () => {
  it('starts with no auth', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('sets auth state', () => {
    const user = { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User' };
    act(() => {
      useAuthStore.getState().setAuth('access-token', 'refresh-token', user);
    });
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('access-token');
    expect(state.refreshToken).toBe('refresh-token');
    expect(state.user).toEqual(user);
  });

  it('updates user', () => {
    const user = { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User' };
    act(() => {
      useAuthStore.getState().setAuth('token', 'refresh', user);
    });
    const updatedUser = { ...user, firstName: 'Updated' };
    act(() => {
      useAuthStore.getState().setUser(updatedUser);
    });
    expect(useAuthStore.getState().user?.firstName).toBe('Updated');
  });

  it('clears auth state', () => {
    const user = { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User' };
    act(() => {
      useAuthStore.getState().setAuth('token', 'refresh', user);
    });
    act(() => {
      useAuthStore.getState().clearAuth();
    });
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
