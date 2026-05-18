import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, Euro, Clock, AlertTriangle,
  Users, Package, FileText, CheckCircle,
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { dashboardApi } from '@/api/dashboard';
import { fmt } from '@/utils/format';
import KpiCard from '@/components/ui/KpiCard';
import type { DashboardKpis } from '@/types';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, Filler,
);

export default function DashboardPage() {
  const { data: rawKpis, isLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn:  dashboardApi.kpis,
    refetchInterval: 60_000,
  });
  const kpis = rawKpis as DashboardKpis | undefined;

  if (isLoading || !kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Gráfico evolução faturação
  const chartLabels = kpis.evolucaoFaturacao.map((e) => e.mes);
  const chartData   = kpis.evolucaoFaturacao.map((e) => e.total);

  const lineChartData = {
    labels: chartLabels,
    datasets: [{
      label: 'Faturação (€)',
      data:   chartData,
      borderColor:     '#696cff',
      backgroundColor: 'rgba(105,108,255,.12)',
      borderWidth: 2.5,
      pointBackgroundColor: '#696cff',
      fill: true,
      tension: 0.4,
    }],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f8' },
        ticks: { callback: (v: unknown) => fmt.currency(v as number) } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral do seu negócio</p>
      </div>

      {/* Alertas */}
      {kpis.alertas?.length > 0 && (
        <div className="space-y-2">
          {kpis.alertas.map((alerta, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm
              ${alerta.nivel === 'danger'  ? 'bg-red-50 border border-red-200 text-red-700'  : ''}
              ${alerta.nivel === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' : ''}
              ${alerta.nivel === 'info'    ? 'bg-blue-50 border border-blue-200 text-blue-700'   : ''}`}>
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">{alerta.titulo}:</span>{' '}
                {alerta.descricao}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Faturação do Mês"
          value={fmt.currency(kpis.faturacaoMes)}
          icon={<Euro size={22} />}
          iconBg="from-indigo-500 to-purple-500"
          subtitle="vs mês anterior"
        />
        <KpiCard
          title="Recebimentos"
          value={fmt.currency(kpis.recebimentosMes)}
          icon={<CheckCircle size={22} />}
          iconBg="from-green-500 to-emerald-500"
        />
        <KpiCard
          title="Saldo Pendente"
          value={fmt.currency(kpis.saldoPendente)}
          icon={<Clock size={22} />}
          iconBg="from-yellow-400 to-orange-400"
          warning={kpis.saldoPendente > 0}
        />
        <KpiCard
          title="Saldo Vencido"
          value={fmt.currency(kpis.saldoVencido)}
          icon={<AlertTriangle size={22} />}
          iconBg="from-red-400 to-rose-500"
          danger={kpis.saldoVencido > 0}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Clientes Ativos"
          value={kpis.clientesAtivos}
          subtitle={`de ${kpis.totalClientes} total`}
          icon={<Users size={22} />}
          iconBg="from-cyan-400 to-blue-500"
        />
        <KpiCard
          title="Artigos"
          value={kpis.totalArtigos}
          icon={<Package size={22} />}
          iconBg="from-violet-400 to-purple-500"
          warning={kpis.alertasStock > 0}
          subtitle={kpis.alertasStock > 0 ? `${kpis.alertasStock} c/ stock baixo` : undefined}
        />
        <KpiCard
          title="Docs Emitidos"
          value={kpis.docEmitidos}
          subtitle="este mês"
          icon={<FileText size={22} />}
          iconBg="from-teal-400 to-cyan-500"
        />
        <KpiCard
          title="Docs Vencidos"
          value={kpis.docVencidos}
          icon={<TrendingUp size={22} />}
          iconBg="from-orange-400 to-red-400"
          danger={kpis.docVencidos > 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linha — evolução */}
        <div className="bg-white rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Evolução da Faturação (12 meses)</h3>
          <div className="chart-wrap">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Resumo rápido */}
        <div className="bg-white rounded-xl p-5 shadow-card">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Resumo Financeiro</h3>
          <div className="space-y-3">
            {[
              { label: 'Faturação do Mês',  value: fmt.currency(kpis.faturacaoMes),   color: 'bg-indigo-500' },
              { label: 'Recebimentos',       value: fmt.currency(kpis.recebimentosMes), color: 'bg-green-500' },
              { label: 'Saldo Pendente',     value: fmt.currency(kpis.saldoPendente),  color: 'bg-yellow-500' },
              { label: 'Saldo Vencido',      value: fmt.currency(kpis.saldoVencido),   color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
            <span className="text-xs text-gray-400">Documentos emitidos este mês</span>
            <span className="text-xs font-bold text-indigo-600">{kpis.docEmitidos} docs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
