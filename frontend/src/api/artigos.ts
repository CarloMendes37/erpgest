import { api, unwrap } from './client';
import type { Artigo } from '@/types';

export const artigosApi = {
  list:         (params?: Record<string, unknown>) => api.get<{ data: { data: Artigo[]; total: number } }>('/comercial/artigos', { params }).then(unwrap),
  get:          (id: number)                        => api.get<{ data: Artigo }>(`/comercial/artigos/${id}`).then(unwrap),
  create:       (dto: Partial<Artigo>)              => api.post<{ data: Artigo }>('/comercial/artigos', dto).then(unwrap),
  update:       (id: number, dto: Partial<Artigo>)  => api.patch<{ data: Artigo }>(`/comercial/artigos/${id}`, dto).then(unwrap),
  delete:       (id: number)                        => api.delete(`/comercial/artigos/${id}`),
  alertasStock: ()                                  => api.get('/comercial/artigos/alertas-stock').then(unwrap),
};
