import { api, unwrap } from './client';
import type { Tenant } from '@/types';

export const tenantsApi = {
  list: () => unwrap<Tenant[]>(api.get('/tenants')),

  get: (id: number) => unwrap<Tenant>(api.get(`/tenants/${id}`)),

  create: (data: Partial<Tenant>) =>
    unwrap<Tenant>(api.post('/tenants', data)),

  update: (id: number, data: Partial<Tenant>) =>
    unwrap<Tenant>(api.put(`/tenants/${id}`, data)),

  toggleActive: (id: number) =>
    unwrap<Tenant>(api.patch(`/tenants/${id}/toggle-active`)),
};
