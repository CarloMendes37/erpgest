import { api, unwrap } from './client';
import type { AuthTokens, LoginDto, RegisterDto, User } from '@/types';

export const authApi = {
  login:    (dto: LoginDto)    => api.post<{ data: AuthTokens }>('/auth/login', dto).then(unwrap),
  register: (dto: RegisterDto) => api.post<{ data: AuthTokens }>('/auth/register', dto).then(unwrap),
  refresh:  (token: string)    => api.post<{ data: AuthTokens }>('/auth/refresh', { refreshToken: token }).then(unwrap),
  logout:   (token: string)    => api.post('/auth/logout', { refreshToken: token }),
  me:       ()                 => api.get<{ data: User }>('/auth/me').then(unwrap),
};
