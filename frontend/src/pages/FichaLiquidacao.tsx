import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, ChevronRight, ChevronLeft, CheckCircle,
  Loader2, Banknote, Building, Smartphone,
} from 'lucide-react';
import { faturasApi } from '@/api/faturas';
import type { Fatura } from '@/types';
import { fmt } from '@/utils/format';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────
interface LiquidacaoForm {
  valor:          number;
  formaPagamento: string;
  referencia:     string;
  banco:          string;
  dataPagamento:  string;
  observacoes:    string;
}

interface Props {
  fatura: Fatura;
  onClose: () => void;
}

const FORMAS_PAGAMENTO = [
  { id: 'NUMERARIO',       label: 'Numerário',       icon: <Banknote size={20} />,    desc: 'Pagamento em dinheiro' },
  { id: 'TRANSFERENCIA',   label: 'Transferência',   icon: <Building size={20} />,    desc: 'Transferência bancária' },
  { id: 'CHEQUE',          label: 'Cheque',          icon: <CreditCard size={20} />,  desc: 'Pagamento por cheque' },
  { id: 'MULTICAIXA',      label: 'Multicaixa',      icon: <Smartphone size={20} />,  desc: 'Pagamento por Multicaixa' },
  { id: 'MULTICAIXA_EXPRESS', label: 'MCX Express',  icon: <Smartphone size={20} />,  desc: 'Multicaixa Express (app)' },
  { id: 'DEPOSITO',        label: 'Depósito',        icon: <Building size={20} />,    desc: 'Depósito bancário' },
];

const STEPS = ['Valor', 'Método', 'Referência', 'Confirmar'];

export default function FichaLiquidacao({ fatura, onClose }: Props) {
  const qc    = useQueryClient();
  const [step, setStep] = useState(0);
  const saldoPendente   = fatura.total - fatura.totalPago;

  const [form, setForm] = useState<LiquidacaoForm>({
    valor:          saldoPendente,
    formaPagamento: '',
    referencia:     '',
    banco:          '',
    dataPagamento:  new Date().toISOString().split('T')[0],
    observacoes:    '',
  });

  const liquidar = useMutation({
    mutationFn: () => faturasApi.liquidar(fatura.id, {
      valor:          form.valor,
      formaPagamento: form.formaPagamento,
      referencia:     form.referencia || undefined,
      banco:          form.banco || undefined,
      dataPagamento:  form.dataPagamento,
      observacoes:    form.observacoes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faturas'] });
      qc.invalidateQueries({ queryKey: ['fatura', String(fatura.id)] });
      qc.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      toast.success(`Pagamento de ${fmt.currency(form.valor)} registado!`);
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao registar pagamento'),
  });

  // ── validation per step ───────────────────────────────────────
  const canNext = () => {
    if (step === 0) return form.valor > 0 && form.valor <= saldoPendente;
    if (step === 1) return !!form.formaPagamento;
    if (step === 2) return !!form.dataPagamento;
    return true;
  };

  // ── STEP 0: Valor ────────────────────────────────────────────
  const StepValor = () => (
    <div className="space-y-5">
      <div className="bg-indigo-50 rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Total da Fatura</span>
          <span className="font-semibold text-gray-700">{fmt.currency(fatura.total)}</span>
        </div>
        {fatura.totalPago > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Já Pago</span>
            <span className="font-semibold text-green-600">- {fmt.currency(fatura.totalPago)}</span>
          </div>
        )}
        <div className="border-t border-indigo-100 pt-2 flex justify-between">
          <span className="font-semibold text-indigo-700">Saldo Pendente</span>
          <span className="font-bold text-indigo-700 text-lg">{fmt.currency(saldoPendente)}</span>
        </div>
      </div>

      <div>
        <label className="form-label">Valor a Liquidar <span className="text-red-500">*</span></label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Kz</span>
          <input
            type="number"
            className="form-input pl-10 text-lg font-semibold"
            value={form.valor}
            min={0.01}
            max={saldoPendente}
            step={0.01}
            onChange={e => setForm(f => ({ ...f, valor: Math.min(+e.target.value, saldoPendente) }))}
          />
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-100 transition"
            onClick={() => setForm(f => ({ ...f, valor: saldoPendente }))}
          >
            Valor Total ({fmt.currency(saldoPendente)})
          </button>
          <button
            type="button"
            className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200 transition"
            onClick={() => setForm(f => ({ ...f, valor: +(saldoPendente / 2).toFixed(2) }))}
          >
            50% ({fmt.currency(saldoPendente / 2)})
          </button>
        </div>
        {form.valor > saldoPendente && (
          <p className="text-xs text-red-500 mt-1">Valor não pode exceder o saldo pendente</p>
        )}
      </div>
    </div>
  );

  // ── STEP 1: Forma de pagamento ────────────────────────────────
  const StepMetodo = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {FORMAS_PAGAMENTO.map(fp => (
        <button
          key={fp.id}
          type="button"
          onClick={() => setForm(f => ({ ...f, formaPagamento: fp.id }))}
          className={`p-4 rounded-xl border-2 text-left transition-all ${
            form.formaPagamento === fp.id
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
          }`}
        >
          <div className={`mb-2 ${form.formaPagamento === fp.id ? 'text-indigo-600' : 'text-gray-400'}`}>
            {fp.icon}
          </div>
          <p className={`text-sm font-semibold ${form.formaPagamento === fp.id ? 'text-indigo-700' : 'text-gray-700'}`}>
            {fp.label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{fp.desc}</p>
        </button>
      ))}
    </div>
  );

  // ── STEP 2: Referência & Data ─────────────────────────────────
  const StepReferencia = () => (
    <div className="space-y-4">
      <div>
        <label className="form-label">Data do Pagamento <span className="text-red-500">*</span></label>
        <input
          type="date"
          className="form-input"
          value={form.dataPagamento}
          onChange={e => setForm(f => ({ ...f, dataPagamento: e.target.value }))}
        />
      </div>

      {['TRANSFERENCIA', 'DEPOSITO', 'CHEQUE'].includes(form.formaPagamento) && (
        <div>
          <label className="form-label">Banco / Instituição</label>
          <input
            className="form-input"
            placeholder="Ex: BFA, BAI, BPC..."
            value={form.banco}
            onChange={e => setForm(f => ({ ...f, banco: e.target.value }))}
          />
        </div>
      )}

      <div>
        <label className="form-label">
          {form.formaPagamento === 'CHEQUE' ? 'Nº Cheque'
            : form.formaPagamento === 'TRANSFERENCIA' ? 'Nº Transferência / IBAN'
            : form.formaPagamento === 'MULTICAIXA' || form.formaPagamento === 'MULTICAIXA_EXPRESS' ? 'Referência Multicaixa'
            : 'Referência / Documento'}
        </label>
        <input
          className="form-input"
          placeholder="Opcional — mas recomendado"
          value={form.referencia}
          onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
        />
      </div>

      <div>
        <label className="form-label">Observações</label>
        <textarea
          className="form-input resize-none"
          rows={2}
          placeholder="Notas adicionais sobre este pagamento..."
          value={form.observacoes}
          onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
        />
      </div>
    </div>
  );

  // ── STEP 3: Confirmação ───────────────────────────────────────
  const StepConfirmar = () => {
    const fp = FORMAS_PAGAMENTO.find(x => x.id === form.formaPagamento);
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={24} className="text-green-600" />
            <h3 className="font-semibold text-green-700">Resumo do Pagamento</h3>
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Fatura',         value: fatura.numero },
              { label: 'Cliente',        value: fatura.clienteNome ?? '—' },
              { label: 'Valor a Pagar',  value: fmt.currency(form.valor) },
              { label: 'Forma Pagto.',   value: fp?.label ?? '—' },
              { label: 'Data',           value: fmt.date(form.dataPagamento) },
              { label: 'Banco',          value: form.banco || '—' },
              { label: 'Referência',     value: form.referencia || '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between border-b border-green-100 pb-1 last:border-0">
                <span className="text-gray-500">{row.label}</span>
                <span className="font-medium text-gray-800">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {form.valor < saldoPendente && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm">
            <p className="text-amber-700 font-medium">Pagamento parcial</p>
            <p className="text-amber-600 text-xs mt-0.5">
              Após este pagamento, ficará por liquidar: {fmt.currency(saldoPendente - form.valor)}
            </p>
          </div>
        )}
      </div>
    );
  };

  const STEP_CONTENT = [<StepValor />, <StepMetodo />, <StepReferencia />, <StepConfirmar />];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-800">Registar Pagamento</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-5">Fatura <strong>{fatura.numero}</strong></p>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                i < step ? 'bg-green-500 text-white'
                  : i === step ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <div className={`text-xs ml-1 flex-1 ${i === step ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-4 mx-1 rounded ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[200px]">
          {STEP_CONTENT[step]}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="btn-ghost flex items-center gap-1"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
          ) : (
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep(s => s + 1)}
              className="btn-primary flex-1 flex items-center justify-center gap-1 disabled:opacity-50"
            >
              Próximo <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={liquidar.isPending}
              onClick={() => liquidar.mutate()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {liquidar.isPending
                ? <><Loader2 size={15} className="animate-spin" /> A processar...</>
                : <><CheckCircle size={15} /> Confirmar Pagamento</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
