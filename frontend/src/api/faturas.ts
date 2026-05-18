import { api, unwrap } from './client';
import type { Fatura, CreateFaturaDto } from '@/types';

export const faturasApi = {
  list:       (params?: Record<string, unknown>) => api.get<{ data: { data: Fatura[]; total: number } }>('/comercial/faturas', { params }).then(unwrap),
  get:        (id: number)                        => api.get<{ data: Fatura }>(`/comercial/faturas/${id}`).then(unwrap),
  create:     (dto: CreateFaturaDto)              => api.post<{ data: Fatura }>('/comercial/faturas', dto).then(unwrap),
  update:     (id: number, dto: Partial<CreateFaturaDto>) => api.patch<{ data: Fatura }>(`/comercial/faturas/${id}`, dto).then(unwrap),
  anular:     (id: number, motivo?: string)       => api.patch(`/comercial/faturas/${id}/anular`, { motivo }),
  liquidar:   (id: number, valor: number)         => api.patch(`/comercial/faturas/${id}/liquidar`, { valor }),
  kpis:       ()                                  => api.get('/comercial/faturas/kpis').then(unwrap),
  pendentes:  ()                                  => api.get('/comercial/faturas/pendentes').then(unwrap),
  estatisticas: (params?: Record<string, unknown>) => api.get('/comercial/faturas/estatisticas', { params }).then(unwrap),
};
