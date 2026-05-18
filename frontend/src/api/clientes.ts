import { api, unwrap } from './client';
import type { Cliente } from '@/types';

export const clientesApi = {
  list:   (params?: Record<string, unknown>) => api.get<{ data: { data: Cliente[]; total: number } }>('/comercial/clientes', { params }).then(unwrap),
  get:    (id: number)                        => api.get<{ data: Cliente }>(`/comercial/clientes/${id}`).then(unwrap),
  create: (dto: Partial<Cliente>)             => api.post<{ data: Cliente }>('/comercial/clientes', dto).then(unwrap),
  update: (id: number, dto: Partial<Cliente>) => api.patch<{ data: Cliente }>(`/comercial/clientes/${id}`, dto).then(unwrap),
  delete: (id: number)                        => api.delete(`/comercial/clientes/${id}`),
  stats:  (id: number)                        => api.get(`/comercial/clientes/${id}/stats`).then(unwrap),
};
