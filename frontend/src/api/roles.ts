import { api, unwrap } from './client';
import type { Role } from '@/types';

export const rolesApi = {
  list: () => unwrap<Role[]>(api.get('/roles')),

  get: (id: number) => unwrap<Role>(api.get(`/roles/${id}`)),

  create: (data: { name: string; description?: string }) =>
    unwrap<Role>(api.post('/roles', data)),

  update: (id: number, data: { name?: string; description?: string }) =>
    unwrap<Role>(api.put(`/roles/${id}`, data)),
};
