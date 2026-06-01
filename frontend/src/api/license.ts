import { api, unwrap } from './client';
import type { License } from '@/types';

export const licenseApi = {
  list: () => unwrap<License[]>(api.get('/license')),

  getActive: () => unwrap<License | null>(api.get('/license/active')),

  create: (data: {
    anoFiscal?: number;
    tipo?: string;
    modulos?: string;
    maxUsers?: number;
    maxFaturas?: number;
    validaAte?: string;
    observacoes?: string;
  }) => unwrap<License>(api.post('/license', data)),

  revoke: (id: number) =>
    unwrap<{ message: string }>(api.patch(`/license/${id}/revoke`)),
};
