import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

// ── Instância principal ──────────────────────────────────────
export const api = axios.create({
  baseURL: `${BASE_URL}/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Controlo de refresh ──────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

// ── Request interceptor: injeta Bearer token ─────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: refresh automático ao 401 ─────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      // Não tentar refresh na rota de login/refresh
      const url = original.url ?? '';
      if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      original._retry = true;

      if (isRefreshing) {
        // Enfileira enquanto refresh está em curso
        return new Promise<string>((resolve) => {
          refreshQueue.push(resolve);
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        isRefreshing = false;
        clearSession();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/v1/auth/refresh`, {
          refreshToken,
        });
        const newAccess = data.data?.accessToken ?? data.accessToken;
        const newRefresh = data.data?.refreshToken ?? data.refreshToken;

        localStorage.setItem('accessToken',  newAccess);
        localStorage.setItem('refreshToken', newRefresh);

        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        original.headers.Authorization = `Bearer ${newAccess}`;

        processQueue(newAccess);
        return api(original);
      } catch {
        clearSession();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// ── Helpers de extração de dados do envelope ─────────────────
export function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data;
}
