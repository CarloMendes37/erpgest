import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { dashboardApi } from '@/api/dashboard';
import { fmt } from '@/utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function MapasPage() {
  const hoje = new Date();
  const [periodo, setPeriodo] = useState({
    dataInicio: `${hoje.getFullYear()}-01-01`,
    dataFim:    hoje.toISOString().split('T')[0],
  });

  const { data: rawRelatorio, isLoading, refetch } = useQuery({
    queryKey: ['relatorio-vendas', periodo],
    queryFn:  () => dashboardApi.relatorioVendas(periodo),
  });
  const relatorio = rawRelatorio as Record<string, unknown> | undefined;

  const { data: rawComercialKpis } = useQuery({
    queryKey: ['comercial-kpis'],
    queryFn:  dashboardApi.comercialKpis,
  });
  const comercialKpis = rawComercialKpis as Record<string, unknown> | undefined;

  // Gráfico faturação diária
  const diarioData = {
    labels: (((comercialKpis as Record<string, unknown> | undefined)?.faturacaoDiaria as { data: string }[] | undefined) ?? []).map((d: { data: string }) => d.data),
    datasets: [{
      label: 'Faturação (€)',
      data:   (((comercialKpis as Record<string, unknown> | undefined)?.faturacaoDiaria as { total: number }[] | undefined) ?? []).map((d: { total: number }) => d.total),
      backgroundColor: 'rgba(105,108,255,.7)',
      borderRadius: 6,
    }],
  };

  // Gráfico por tipo
  const tipoLabels = (((comercialKpis as Record<string, unknown> | undefined)?.porTipo as { tipo: string }[] | undefined) ?? []).map((t: { tipo: string }) => t.tipo);
  const tipoValues = (((comercialKpis as Record<string, unknown> | undefined)?.porTipo as { total: number }[] | undefined) ?? []).map((t: { total: number }) => t.total);
  const doughnutData = {
    labels: tipoLabels,
    datasets: [{
      data: tipoValues,
      backgroundColor: ['#696cff','#9155fd','#71dd37','#03c3ec','#ffab00','#ff3e1d','#8592a3'],
      borderWidth: 0,
    }],
  };

  // Top clientes do período
  type TopCliente = { clienteId: number; nome: string; total: number; count: number };
  const topClientes = (((relatorio as Record<string, unknown> | undefined)?.porCliente as TopCliente[] | undefined) ?? []).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mapas & Relatórios</h1>
        <p className="text-sm text-gray-500">Análise de vendas e faturação</p>
      </div>

      {/* Filtros período */}
      <div className="bg-white rounded-xl p-4 shadow-card flex flex-wrap gap-3 items-end">
        <div>
          <label className="form-label">Data Início</label>
          <input type="date" value={periodo.dataInicio}
            onChange={(e) => setPeriodo(p => ({ ...p, dataInicio: e.target.value }))}
            className="form-input" />
        </div>
        <div>
          <label className="form-label">Data Fim</label>
          <input type="date" value={periodo.dataFim}
            onChange={(e) => setPeriodo(p => ({ ...p, dataFim: e.target.value }))}
            className="form-input" />
        </div>
        <button onClick={() => refetch()} className="btn-primary h-10">
          Atualizar
        </button>
      </div>

      {/* Resumo período */}
      {relatorio && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Faturado', value: fmt.currency(((relatorio as Record<string,unknown>)?.resumo as Record<string,number> | undefined)?.totalFaturado ?? 0), color: 'text-indigo-600' },
            { label: 'Total Recebido', value: fmt.currency(((relatorio as Record<string,unknown>)?.resumo as Record<string,number> | undefined)?.totalPago ?? 0),     color: 'text-green-600' },
            { label: 'Em Divída',      value: fmt.currency(((relatorio as Record<string,unknown>)?.resumo as Record<string,number> | undefined)?.totalPendente ?? 0), color: 'text-red-500' },
            { label: 'Nº Faturas',     value: (((relatorio as Record<string,unknown>)?.resumo as Record<string,number> | undefined)?.numFaturas ?? 0),                  color: 'text-gray-700' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl p-4 shadow-card">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{k.label}</p>
              <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturação diária */}
        <div className="bg-white rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Faturação Diária (30 dias)</h3>
          <div className="chart-wrap">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <Bar data={diarioData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f0f0f8' },
                    ticks: { callback: (v: unknown) => fmt.currency(v as number) } },
                  x: { grid: { display: false } },
                },
              }} />
            )}
          </div>
        </div>

        {/* Por tipo */}
        <div className="bg-white rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Faturação por Tipo (mês atual)</h3>
          <div className="chart-wrap">
            {tipoValues.length > 0 ? (
              <Doughnut data={doughnutData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } },
                cutout: '65%',
              }} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Sem dados para o mês atual
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Clientes */}
      {topClientes.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Top Clientes no Período</h3>
          <div className="space-y-2">
            {topClientes.map((c, i) => {
              const maxVal = topClientes[0]?.total ?? 1;
              const pct    = (c.total / maxVal) * 100;
              return (
                <div key={c.clienteId} className="flex items-center gap-3">
                  <span className="w-6 text-xs font-bold text-gray-400">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-gray-700">{c.nome ?? '—'}</span>
                      <span className="text-sm font-bold text-indigo-600">{fmt.currency(c.total)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-grad-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right">{c.count} docs</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
