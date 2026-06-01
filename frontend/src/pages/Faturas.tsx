import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, XCircle, CreditCard, Filter, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { faturasApi } from '@/api/faturas';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import { fmt } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { FATURA_STATUS_LABEL, FATURA_STATUS_CLASS, FATURA_TIPO_LABEL } from '@/types';
import type { Fatura } from '@/types';
import NovaFatura from './NovaFatura';
import FichaLiquidacao from './FichaLiquidacao';

const STATUS_OPTS = [
  { value: '', label: 'Todos os estados' },
  { value: '0', label: 'Rascunho' },
  { value: '1', label: 'Emitida' },
  { value: '2', label: 'Paga' },
  { value: '3', label: 'Parcial' },
  { value: '4', label: 'Anulada' },
  { value: '5', label: 'Vencida' },
];

export default function FaturasPage() {
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage]          = useState(1);
  const [search, setSearch]      = useState('');
  const [status, setStatus]      = useState('');
  const [showNova, setShowNova]  = useState(false);
  const [detail, setDetail]      = useState<Fatura | null>(null);
  const [liquidarFatura, setLiquidarFatura] = useState<Fatura | null>(null);
  const debSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ['faturas', page, debSearch, status],
    queryFn:  () => faturasApi.list({
      page, limit: 20,
      search: debSearch || undefined,
      status: status || undefined,
    }),
  });

  const { data: kpis } = useQuery({
    queryKey: ['faturas-kpis'],
    queryFn:  faturasApi.kpis,
  });

  const anularMut = useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) => faturasApi.anular(id, motivo),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['faturas'] }); toast.success('Documento anulado'); },
    onError:    () => toast.error('Erro ao anular'),
  });

  // liquidarMut moved to FichaLiquidacao component

  const columns = [
    {
      key: 'numero', label: 'Número',
      render: (r: Fatura) => (
        <div>
          <p className="font-mono font-semibold text-indigo-600 text-sm">{r.numero}</p>
          <p className="text-xs text-gray-400">{FATURA_TIPO_LABEL[r.tipo] ?? r.tipo} · {r.serie}</p>
        </div>
      ),
    },
    {
      key: 'clienteNome', label: 'Cliente',
      render: (r: Fatura) => (
        <div>
          <p className="font-medium text-gray-800 text-sm">{r.clienteNome ?? '—'}</p>
          {r.clienteNif && <p className="text-xs text-gray-400">NIF {r.clienteNif}</p>}
        </div>
      ),
    },
    { key: 'data', label: 'Data', render: (r: Fatura) => fmt.date(r.data) },
    { key: 'dataVencimento', label: 'Vencimento',
      render: (r: Fatura) => r.dataVencimento ? fmt.date(r.dataVencimento) : '—' },
    { key: 'total', label: 'Total', align: 'right' as const,
      render: (r: Fatura) => <span className="font-bold text-gray-800">{fmt.currency(r.total)}</span> },
    { key: 'saldo', label: 'Saldo', align: 'right' as const,
      render: (r: Fatura) => (
        <span className={`font-semibold ${Number(r.saldo) > 0 ? 'text-red-500' : 'text-green-600'}`}>
          {fmt.currency(r.saldo)}
        </span>
      ),
    },
    { key: 'status', label: 'Estado',
      render: (r: Fatura) => (
        <span className={`badge ${FATURA_STATUS_CLASS[r.status]}`}>
          {FATURA_STATUS_LABEL[r.status]}
        </span>
      ),
    },
    {
      key: 'actions', label: '',
      render: (r: Fatura) => (
        <div className="flex gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); setDetail(r); }}
            title="Ver detalhe rápido"
            className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-indigo-500">
            <Eye size={14} />
          </button>
          <button
              onClick={(e) => { e.stopPropagation(); navigate(`/faturas/${r.id}`); }}
              title="Abrir página de detalhe"
              className="w-8 h-8 rounded-lg hover:bg-purple-50 flex items-center justify-center text-purple-400">
              <ExternalLink size={14} />
            </button>
          {[1, 3].includes(r.status) && (
            <button
              onClick={(e) => { e.stopPropagation(); setLiquidarFatura(r); }}
              title="Registar pagamento"
              className="w-8 h-8 rounded-lg hover:bg-green-50 flex items-center justify-center text-green-500">
              <CreditCard size={14} />
            </button>
          )}
          {[0, 1].includes(r.status) && (
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm('Anular documento?')) anularMut.mutate({ id: r.id }); }}
              title="Anular"
              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400">
              <XCircle size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (showNova) return <NovaFatura onBack={() => { setShowNova(false); qc.invalidateQueries({ queryKey: ['faturas'] }); }} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Faturação</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} documentos</p>
        </div>
        <button onClick={() => setShowNova(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova Fatura
        </button>
      </div>

      {/* KPIs rápidos */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Faturação Mês',  value: fmt.currency((kpis as Record<string, unknown> & { faturacaoMes: number }).faturacaoMes ?? 0),   color: 'text-indigo-600' },
            { label: 'Pendente',       value: fmt.currency((kpis as Record<string, unknown> & { totalPendente: number }).totalPendente ?? 0), color: 'text-yellow-600' },
            { label: 'Vencido',        value: fmt.currency((kpis as Record<string, unknown> & { totalVencido: number }).totalVencido ?? 0),  color: 'text-red-600' },
            { label: 'Docs Pendentes', value: (kpis as Record<string, unknown> & { numPendentes: number }).numPendentes ?? 0,                color: 'text-gray-700' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl p-4 shadow-card">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{k.label}</p>
              <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Pesquisar faturas…" className="form-input pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="form-input min-w-[160px]">
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <Table
        columns={columns as unknown as Parameters<typeof Table>[0]['columns']}
        data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
        loading={isLoading}
        total={data?.total ?? 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        emptyText="Nenhuma fatura encontrada"
      />

      {/* Modal detalhe */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detalhe do Documento" size="xl">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-indigo-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Número</p>
                <p className="font-bold text-indigo-600">{detail.numero}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Tipo</p>
                <p className="font-semibold">{FATURA_TIPO_LABEL[detail.tipo]}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Estado</p>
                <span className={`badge ${FATURA_STATUS_CLASS[detail.status]}`}>
                  {FATURA_STATUS_LABEL[detail.status]}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Cliente</p>
              <p className="font-semibold text-gray-800">{detail.clienteNome}</p>
              {detail.clienteNif && <p className="text-sm text-gray-500">NIF: {detail.clienteNif}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-500">Data Emissão</p><p className="font-medium">{fmt.date(detail.data)}</p></div>
              <div><p className="text-xs text-gray-500">Data Vencimento</p><p className="font-medium">{detail.dataVencimento ? fmt.date(detail.dataVencimento) : '—'}</p></div>
            </div>
            <div className="border-t pt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>{fmt.currency(detail.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Desconto:</span><span>{fmt.currency(detail.desconto)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Base IVA:</span><span>{fmt.currency(detail.baseIva)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">IVA:</span><span>{fmt.currency(detail.totalIva)}</span></div>
              <div className="flex justify-between col-span-2 font-bold text-base border-t pt-2 mt-1">
                <span>TOTAL:</span><span className="text-indigo-600">{fmt.currency(detail.total)}</span>
              </div>
              <div className="flex justify-between col-span-2 text-green-600">
                <span>Pago:</span><span>{fmt.currency(detail.totalPago)}</span>
              </div>
              <div className="flex justify-between col-span-2 text-red-500 font-semibold">
                <span>Saldo:</span><span>{fmt.currency(detail.saldo)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* FichaLiquidacao wizard */}
      {liquidarFatura && (
        <FichaLiquidacao
          fatura={liquidarFatura}
          onClose={() => setLiquidarFatura(null)}
        />
      )}
    </div>
  );
}
