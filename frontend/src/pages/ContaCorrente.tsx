import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, TrendingDown, AlertTriangle, FileText } from 'lucide-react';
import { contaCorrenteApi } from '@/api/contaCorrente';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import KpiCard from '@/components/ui/KpiCard';
import { fmt } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import type { SaldoCliente, DevedorItem, ExtratoLine } from '@/types';

type Tab = 'saldos' | 'devedores';

export default function ContaCorrentePage() {
  const [tab, setTab]              = useState<Tab>('saldos');
  const [search, setSearch]        = useState('');
  const [page, setPage]            = useState(1);
  const [apenasComSaldo, setApenas] = useState(false);
  const [extratoCliente, setExtrato] = useState<SaldoCliente | null>(null);
  const [extratoData, setExtratoData] = useState<{ dataInicio: string; dataFim: string }>({
    dataInicio: `${new Date().getFullYear()}-01-01`,
    dataFim:    new Date().toISOString().split('T')[0],
  });
  const debSearch = useDebounce(search);

  const { data: resumo } = useQuery({
    queryKey: ['cc-resumo'],
    queryFn:  contaCorrenteApi.resumo,
  });

  const { data: saldos, isLoading: loadSaldos } = useQuery({
    queryKey: ['cc-saldos', page, debSearch, apenasComSaldo],
    queryFn:  () => contaCorrenteApi.saldos({
      page, limit: 20,
      search: debSearch || undefined,
      apenasComSaldo: apenasComSaldo || undefined,
    }),
    enabled: tab === 'saldos',
  });

  const { data: devedores, isLoading: loadDevedores } = useQuery({
    queryKey: ['cc-devedores'],
    queryFn:  () => contaCorrenteApi.devedores({ limite: 100 }),
    enabled: tab === 'devedores',
  });

  const { data: extrato, isLoading: loadExtrato } = useQuery({
    queryKey: ['cc-extrato', extratoCliente?.clienteId, extratoData],
    queryFn:  () => contaCorrenteApi.extrato(extratoCliente!.clienteId, extratoData),
    enabled:  !!extratoCliente,
  });

  const colsSaldos = [
    {
      key: 'clienteNome', label: 'Cliente',
      render: (r: SaldoCliente) => (
        <div>
          <p className="font-semibold text-gray-800">{r.clienteNome}</p>
          {r.clienteNif && <p className="text-xs text-gray-400">NIF: {r.clienteNif}</p>}
        </div>
      ),
    },
    { key: 'totalFaturado', label: 'Faturado', align: 'right' as const,
      render: (r: SaldoCliente) => <span className="font-medium text-gray-700">{fmt.currency(r.totalFaturado)}</span> },
    { key: 'totalPago', label: 'Pago', align: 'right' as const,
      render: (r: SaldoCliente) => <span className="text-green-600 font-medium">{fmt.currency(r.totalPago)}</span> },
    { key: 'saldoPendente', label: 'Saldo Pendente', align: 'right' as const,
      render: (r: SaldoCliente) => (
        <span className={`font-bold ${r.saldoPendente > 0 ? 'text-red-500' : 'text-gray-400'}`}>
          {fmt.currency(r.saldoPendente)}
        </span>
      ),
    },
    { key: 'totalVencido', label: 'Vencido', align: 'right' as const,
      render: (r: SaldoCliente) => (
        <span className={r.totalVencido > 0 ? 'font-bold text-red-600' : 'text-gray-400'}>
          {fmt.currency(r.totalVencido)}
        </span>
      ),
    },
    { key: 'ultimaFatura', label: 'Última Fatura',
      render: (r: SaldoCliente) => r.ultimaFatura ? fmt.date(r.ultimaFatura) : '—' },
    {
      key: 'extrato', label: '',
      render: (r: SaldoCliente) => (
        <button onClick={(e) => { e.stopPropagation(); setExtrato(r); }}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
          <FileText size={12} /> Extrato
        </button>
      ),
    },
  ];

  const colsDevedores = [
    { key: 'rank', label: '#',
      render: (_: DevedorItem, i?: number) => <span className="text-gray-400 font-bold text-sm">{(i ?? 0) + 1}</span> },
    {
      key: 'clienteNome', label: 'Devedor',
      render: (r: DevedorItem) => (
        <div>
          <p className="font-semibold text-gray-800">{r.clienteNome}</p>
          <p className="text-xs text-gray-400">{r.clienteNif}</p>
        </div>
      ),
    },
    { key: 'valorPendente', label: 'Pendente', align: 'right' as const,
      render: (r: DevedorItem) => <span className="font-bold text-yellow-600">{fmt.currency(r.valorPendente)}</span> },
    { key: 'valorVencido', label: 'Vencido', align: 'right' as const,
      render: (r: DevedorItem) => (
        <span className={`font-bold ${r.valorVencido > 0 ? 'text-red-500' : 'text-gray-400'}`}>
          {fmt.currency(r.valorVencido)}
        </span>
      ),
    },
    { key: 'diasAtraso', label: 'Dias Atraso', align: 'center' as const,
      render: (r: DevedorItem) => (
        <span className={`badge ${r.diasAtraso > 60 ? 'badge-vencida' : r.diasAtraso > 30 ? 'badge-parcial' : 'badge-emitida'}`}>
          {r.diasAtraso} dias
        </span>
      ),
    },
    { key: 'numDocumentos', label: 'Docs', align: 'center' as const,
      render: (r: DevedorItem) => <span className="text-sm text-gray-600">{r.numDocumentos}</span> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Conta Corrente</h1>
        <p className="text-sm text-gray-500">Gestão de saldos e créditos de clientes</p>
      </div>

      {/* KPIs resumo */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Total Clientes"    value={(resumo as Record<string, number>).totalClientes ?? 0}
            icon={<TrendingDown size={20}/>} iconBg="from-indigo-500 to-purple-500" />
          <KpiCard title="Com Saldo"         value={(resumo as Record<string, number>).clientesComSaldo ?? 0}
            icon={<AlertTriangle size={20}/>} iconBg="from-yellow-400 to-orange-400" />
          <KpiCard title="Total Pendente"    value={fmt.currency((resumo as Record<string, number>).totalPendente ?? 0)}
            icon={<TrendingDown size={20}/>} iconBg="from-orange-400 to-red-400"
            warning={(resumo as Record<string, number>).totalPendente > 0} />
          <KpiCard title="Total Vencido"     value={fmt.currency((resumo as Record<string, number>).totalVencido ?? 0)}
            icon={<AlertTriangle size={20}/>} iconBg="from-red-400 to-rose-500"
            danger={(resumo as Record<string, number>).totalVencido > 0} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-card w-fit">
        {(['saldos', 'devedores'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition capitalize
              ${tab === t ? 'bg-grad-brand text-white shadow' : 'text-gray-500 hover:text-indigo-600'}`}>
            {t === 'saldos' ? 'Saldos' : 'Mapa Devedores'}
          </button>
        ))}
      </div>

      {tab === 'saldos' && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Pesquisar cliente…" className="form-input pl-9" />
            </div>
            <button onClick={() => setApenas(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition
                ${apenasComSaldo ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
              <AlertTriangle size={14} /> Apenas com saldo
            </button>
          </div>
          <Table
            columns={colsSaldos as Parameters<typeof Table>[0]['columns']}
            data={((saldos as { data?: SaldoCliente[] })?.data ?? []) as Record<string, unknown>[]}
            loading={loadSaldos}
            total={(saldos as { total?: number })?.total ?? 0}
            page={page} limit={20} onPageChange={setPage}
            emptyText="Nenhum cliente com saldo"
          />
        </>
      )}

      {tab === 'devedores' && (
        <div>
          {devedores && (
            <div className="flex gap-4 mb-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm">
                <span className="text-orange-600 font-semibold">Total Vencido: </span>
                <span className="font-bold text-orange-700">{fmt.currency((devedores as { totalVencido?: number }).totalVencido ?? 0)}</span>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm">
                <span className="text-yellow-600 font-semibold">Total Pendente: </span>
                <span className="font-bold text-yellow-700">{fmt.currency((devedores as { totalPendente?: number }).totalPendente ?? 0)}</span>
              </div>
            </div>
          )}
          <Table
            columns={colsDevedores as Parameters<typeof Table>[0]['columns']}
            data={((devedores as { devedores?: DevedorItem[] })?.devedores ?? []) as Record<string, unknown>[]}
            loading={loadDevedores}
            emptyText="Sem devedores"
          />
        </div>
      )}

      {/* Modal Extrato */}
      <Modal open={!!extratoCliente} onClose={() => setExtrato(null)}
        title={`Extrato — ${extratoCliente?.clienteNome}`} size="xl">
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1">
              <label className="form-label">Data Início</label>
              <input type="date" value={extratoData.dataInicio}
                onChange={(e) => setExtratoData(d => ({ ...d, dataInicio: e.target.value }))}
                className="form-input" />
            </div>
            <div className="flex-1">
              <label className="form-label">Data Fim</label>
              <input type="date" value={extratoData.dataFim}
                onChange={(e) => setExtratoData(d => ({ ...d, dataFim: e.target.value }))}
                className="form-input" />
            </div>
          </div>

          {loadExtrato ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : extrato && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-500 font-semibold">Total Débito</p>
                  <p className="font-bold text-blue-700">{fmt.currency((extrato as { totalDebito?: number }).totalDebito ?? 0)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-500 font-semibold">Total Crédito</p>
                  <p className="font-bold text-green-700">{fmt.currency((extrato as { totalCredito?: number }).totalCredito ?? 0)}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-indigo-500 font-semibold">Saldo Final</p>
                  <p className="font-bold text-indigo-700">{fmt.currency((extrato as { saldoFinal?: number }).saldoFinal ?? 0)}</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-100 rounded-xl">
                <table className="w-full text-sm data-table">
                  <thead className="sticky top-0">
                    <tr>
                      {['Data','Tipo','Número','Descrição','Débito','Crédito','Saldo'].map(h =>
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {((extrato as { linhas?: ExtratoLine[] }).linhas ?? []).map((l: ExtratoLine, i: number) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-3 py-2">{fmt.date(l.data)}</td>
                        <td className="px-3 py-2 font-mono text-xs">{l.tipo}</td>
                        <td className="px-3 py-2 text-indigo-600 font-mono">{l.numero}</td>
                        <td className="px-3 py-2 text-gray-600">{l.descricao}</td>
                        <td className="px-3 py-2 text-right text-blue-600">{l.debito > 0 ? fmt.currency(l.debito) : '—'}</td>
                        <td className="px-3 py-2 text-right text-green-600">{l.credito > 0 ? fmt.currency(l.credito) : '—'}</td>
                        <td className="px-3 py-2 text-right font-bold">{fmt.currency(l.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
