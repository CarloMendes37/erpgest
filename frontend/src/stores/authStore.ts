import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import type { User, JwtPayload, AuthTokens, LoginDto } from '@/types';
import { authApi } from '@/api/auth';
import { clearSession } from '@/api/client';

interface AuthState {
  user:         User | null;
  accessToken:  string | null;
  refreshToken: string | null;
  tenantId:     number | null;
  tenantSlug:   string | null;
  roles:        string[];
  isLoading:    boolean;

  login:   (dto: LoginDto) => Promise<void>;
  logout:  () => Promise<void>;
  loadMe:  () => Promise<void>;
  setTokens: (tokens: AuthTokens) => void;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      tenantId:     null,
      tenantSlug:   null,
      roles:        [],
      isLoading:    false,

      setTokens: (tokens) => {
        const decoded = jwtDecode<JwtPayload>(tokens.accessToken);
        localStorage.setItem('accessToken',  tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        set({
          accessToken:  tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tenantId:     decoded.tenantId,
          tenantSlug:   decoded.tenantSlug,
          roles:        decoded.roles ?? [],
        });
      },

      login: async (dto) => {
        set({ isLoading: true });
        try {
          const tokens = await authApi.login(dto);
          get().setTokens(tokens);
          const user = await authApi.me();
          set({ user });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const rt = get().refreshToken;
        if (rt) {
          try { await authApi.logout(rt); } catch { /* silent */ }
        }
        clearSession();
        set({ user: null, accessToken: null, refreshToken: null, tenantId: null, tenantSlug: null, roles: [] });
      },

      loadMe: async () => {
        try {
          const user = await authApi.me();
          set({ user });
        } catch { /* token inválido — ignorar, interceptor vai redirecionar */ }
      },

      hasRole: (role) => get().roles.includes(role),
      isAdmin: () => get().roles.some((r) => r === 'ROLE_ADMIN' || r === 'ADMIN'),
    }),
    {
      name: 'erpgest-auth',
      partialize: (s) => ({
        accessToken:  s.accessToken,
        refreshToken: s.refreshToken,
        tenantId:     s.tenantId,
        tenantSlug:   s.tenantSlug,
        roles:        s.roles,
        user:         s.user,
      }),
    },
  ),
);
