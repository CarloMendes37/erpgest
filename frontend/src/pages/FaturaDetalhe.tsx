import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Printer, Download, FileText,
  Loader2, CheckCircle, XCircle, Clock, AlertTriangle,
} from 'lucide-react';
import { faturasApi } from '@/api/faturas';
import type { Fatura, FaturaLinha } from '@/types';
import { fmt } from '@/utils/format';
import {
  FATURA_STATUS_LABEL,
  FATURA_TIPO_LABEL,
} from '@/types';

const STATUS_CONFIG: Record<number, { label: string; icon: React.ReactNode; cls: string }> = {
  0: { label: 'Rascunho', icon: <Clock size={14} />,          cls: 'bg-gray-100 text-gray-600' },
  1: { label: 'Emitida',  icon: <FileText size={14} />,       cls: 'bg-blue-100 text-blue-700' },
  2: { label: 'Paga',     icon: <CheckCircle size={14} />,    cls: 'bg-green-100 text-green-700' },
  3: { label: 'Parcial',  icon: <AlertTriangle size={14} />,  cls: 'bg-amber-100 text-amber-700' },
  4: { label: 'Anulada',  icon: <XCircle size={14} />,        cls: 'bg-red-100 text-red-600' },
  5: { label: 'Vencida',  icon: <AlertTriangle size={14} />,  cls: 'bg-orange-100 text-orange-700' },
};

export default function FaturaDetalhe() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const printRef   = useRef<HTMLDivElement>(null);

  const { data: fatura, isLoading } = useQuery({
    queryKey: ['fatura', id],
    queryFn: () => faturasApi.get(Number(id)),
    enabled: !!id,
  });

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
      </div>
    );
  }

  if (!fatura) {
    return (
      <div className="bg-red-50 rounded-xl p-8 text-center">
        <XCircle size={48} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-red-700">Fatura não encontrada</h2>
        <button onClick={() => navigate('/faturas')} className="btn-primary mt-4">
          Voltar às Faturas
        </button>
      </div>
    );
  }

  const f = fatura as Fatura;
  const statusConf = STATUS_CONFIG[f.status] ?? STATUS_CONFIG[1];
  const saldoPendente = f.total - f.totalPago;

  return (
    <div className="space-y-4">
      {/* Toolbar — hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/faturas')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Voltar às Faturas
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <Printer size={15} /> Imprimir
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Download size={15} /> PDF
          </button>
        </div>
      </div>

      {/* Document — printable area */}
      <div ref={printRef} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">

        {/* Document Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white print:bg-[#696cff] print:text-white">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {FATURA_TIPO_LABEL[f.tipo] ?? f.tipo}
              </h1>
              <p className="text-indigo-200 text-lg font-mono mt-1">{f.numero}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white`}>
                  {statusConf.icon}
                  {statusConf.label}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold">{fmt.currency(f.total)}</div>
              <div className="text-indigo-200 text-sm mt-0.5">Total com IVA</div>
              {saldoPendente > 0 && f.status !== 4 && (
                <div className="mt-2 bg-amber-400/30 rounded-lg px-3 py-1.5">
                  <p className="text-xs text-amber-100">Saldo pendente</p>
                  <p className="font-bold text-amber-200">{fmt.currency(saldoPendente)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-b border-gray-100">
          {[
            { label: 'Data de Emissão',    value: fmt.date(f.data) },
            { label: 'Data de Vencimento', value: f.dataVencimento ? fmt.date(f.dataVencimento) : '—' },
            { label: 'Série',              value: f.serie || '—' },
            { label: 'Cond. Pagamento',    value: f.condPagamento || '—' },
          ].map((item, i) => (
            <div key={item.label} className={`p-4 ${i < 3 ? 'border-r border-gray-100' : ''}`}>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Client Details */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">
            Cliente / Destinatário
          </h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
              {f.clienteNome?.charAt(0).toUpperCase() ?? 'C'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{f.clienteNome ?? '—'}</h2>
              {f.clienteNif && (
                <p className="text-sm text-gray-500">NIF: {f.clienteNif}</p>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-6">
          <h3 className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-4">
            Linhas do Documento
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Descrição</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Qtd</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Unid</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Pr. Unit.</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Desc.</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">IVA</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {(f.linhas ?? []).map((l: FaturaLinha, idx: number) => (
                  <tr key={l.id ?? idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800 text-sm">{l.artDescricao}</p>
                      {l.artCodigo && (
                        <p className="text-xs text-gray-400">{l.artCodigo}</p>
                      )}
                      {l.observacoes && (
                        <p className="text-xs text-gray-400 italic mt-0.5">{l.observacoes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-600">
                      {fmt.number(l.quantidade)}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-gray-500">
                      {l.unidade ?? 'UN'}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">
                      {fmt.currency(l.precoUnitario)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-500">
                      {l.desconto ? `${l.desconto}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-500">
                      {l.taxaIva}%
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-gray-800">
                      {fmt.currency(l.total ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal (s/ IVA)</span>
                <span className="text-gray-700">{fmt.currency(f.subtotal)}</span>
              </div>
              {f.desconto > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Desconto</span>
                  <span className="text-red-500">- {fmt.currency(f.desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Base IVA</span>
                <span className="text-gray-700">{fmt.currency(f.baseIva)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total IVA</span>
                <span className="text-gray-700">{fmt.currency(f.totalIva)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
                <span className="text-gray-800">TOTAL</span>
                <span className="text-indigo-700">{fmt.currency(f.total)}</span>
              </div>
              {f.totalPago > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pago</span>
                    <span className="text-green-600 font-medium">- {fmt.currency(f.totalPago)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className={saldoPendente > 0 ? 'text-amber-600' : 'text-green-600'}>
                      {saldoPendente > 0 ? 'Saldo Pendente' : 'Liquidado'}
                    </span>
                    <span className={saldoPendente > 0 ? 'text-amber-600' : 'text-green-600'}>
                      {saldoPendente > 0 ? fmt.currency(saldoPendente) : '✓ Pago'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Observations */}
        {f.observacoes && (
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Observações</p>
              <p className="text-sm text-gray-600">{f.observacoes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Emitido em {fmt.dateTime(f.createdAt)} · Moeda: {f.moeda ?? 'AOA'}
          </p>
          <p className="text-xs text-gray-300">ERPGEST v1.0</p>
        </div>
      </div>

      {/* Print styles embedded */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          [ref="printRef"], [ref="printRef"] * { visibility: visible; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}
