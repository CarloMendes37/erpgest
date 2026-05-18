import { api, unwrap } from './client';

export const contaCorrenteApi = {
  resumo:   ()                                 => api.get('/comercial/conta-corrente/resumo').then(unwrap),
  saldos:   (params?: Record<string, unknown>) => api.get('/comercial/conta-corrente/saldos', { params }).then(unwrap),
  devedores:(params?: Record<string, unknown>) => api.get('/comercial/conta-corrente/devedores', { params }).then(unwrap),
  extrato:  (clienteId: number, params?: Record<string, unknown>) =>
    api.get(`/comercial/conta-corrente/clientes/${clienteId}/extrato`, { params }).then(unwrap),
  pendentes:(clienteId: number) =>
    api.get(`/comercial/conta-corrente/clientes/${clienteId}/pendentes`).then(unwrap),
};
