import { api, unwrap } from './client';

export const dashboardApi = {
  kpis:           () => api.get('/dashboard/kpis').then(unwrap),
  comercialKpis:  () => api.get('/comercial/dashboard/kpis').then(unwrap),
  relatorioVendas:(params: { dataInicio: string; dataFim: string }) =>
    api.get('/comercial/dashboard/relatorio-vendas', { params }).then(unwrap),
};
