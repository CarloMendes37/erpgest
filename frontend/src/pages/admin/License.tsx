import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Key, Plus, ShieldOff, CheckCircle, XCircle,
  Loader2, Calendar, Users, FileText, AlertTriangle,
} from 'lucide-react';
import { licenseApi } from '@/api/license';
import type { License } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { fmt } from '@/utils/format';
import toast from 'react-hot-toast';

interface LicenseForm {
  anoFiscal: number;
  tipo: string;
  maxUsers: number;
  maxFaturas: number;
  validaAte: string;
  modulos: string;
  observacoes: string;
}

const EMPTY_FORM: LicenseForm = {
  anoFiscal: new Date().getFullYear(),
  tipo: 'ANUAL',
  maxUsers: 5,
  maxFaturas: 1000,
  validaAte: '',
  modulos: '',
  observacoes: '',
};

const TIPOS = ['TRIAL', 'MENSAL', 'ANUAL', 'PERPETUA'];
const TIPO_COLORS: Record<string, string> = {
  TRIAL:    'bg-yellow-100 text-yellow-700',
  MENSAL:   'bg-blue-100 text-blue-700',
  ANUAL:    'bg-green-100 text-green-700',
  PERPETUA: 'bg-purple-100 text-purple-700',
};

export default function LicensePage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuthStore();
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState<LicenseForm>(EMPTY_FORM);

  // ── queries ──────────────────────────────────────────────────
  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => licenseApi.list(),
  });

  const { data: activeLicense } = useQuery({
    queryKey: ['license-active'],
    queryFn: () => licenseApi.getActive(),
  });

  // ── mutations ────────────────────────────────────────────────
  const create = useMutation({
    mutationFn: () => licenseApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licenses'] });
      qc.invalidateQueries({ queryKey: ['license-active'] });
      setModal(false);
      setForm(EMPTY_FORM);
      toast.success('Licença criada com sucesso!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao criar licença'),
  });

  const revoke = useMutation({
    mutationFn: (id: number) => licenseApi.revoke(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licenses'] });
      qc.invalidateQueries({ queryKey: ['license-active'] });
      toast.success('Licença revogada!');
    },
    onError: () => toast.error('Erro ao revogar licença'),
  });

  const isExpiring = (validaAte: string | null) => {
    if (!validaAte) return false;
    const diff = new Date(validaAte).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 3600 * 1000; // 30 days
  };

  const isExpired = (validaAte: string | null) => {
    if (!validaAte) return false;
    return new Date(validaAte).getTime() < Date.now();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Key size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Licenças</h1>
            <p className="text-sm text-gray-500">Gestão de licenças e subscrições</p>
          </div>
        </div>
        {isAdmin() && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nova Licença
          </button>
        )}
      </div>

      {/* Active License Banner */}
      {activeLicense ? (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={20} />
                <h2 className="font-bold text-lg">Licença Activa</h2>
              </div>
              <p className="text-green-100 text-sm mb-3">
                {(activeLicense as License).licenseKey}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-green-200 text-xs">Tipo</p>
                  <p className="font-semibold">{(activeLicense as License).tipo}</p>
                </div>
                <div>
                  <p className="text-green-200 text-xs">Ano Fiscal</p>
                  <p className="font-semibold">{(activeLicense as License).anoFiscal}</p>
                </div>
                <div>
                  <p className="text-green-200 text-xs">Utilizadores</p>
                  <p className="font-semibold">Até {(activeLicense as License).maxUsers}</p>
                </div>
                <div>
                  <p className="text-green-200 text-xs">Validade</p>
                  <p className="font-semibold">
                    {(activeLicense as License).validaAte
                      ? fmt.date((activeLicense as License).validaAte!)
                      : 'Perpétua'}
                  </p>
                </div>
              </div>
            </div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              ACTIVA
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4">
          <XCircle size={32} className="text-red-400 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-700">Sem Licença Activa</h3>
            <p className="text-sm text-red-500 mt-0.5">
              O sistema não tem licença válida. Contacte o administrador.
            </p>
          </div>
        </div>
      )}

      {/* License History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Histórico de Licenças</h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : (licenses as License[]).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Key size={36} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma licença registada</p>
          </div>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Chave de Licença</th>
                <th>Tipo</th>
                <th>Ano Fiscal</th>
                <th>Utilizadores</th>
                <th>Faturas</th>
                <th>Validade</th>
                <th>Estado</th>
                {isAdmin() && <th className="text-center">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {(licenses as License[]).map(lic => {
                const expired  = isExpired(lic.validaAte);
                const expiring = isExpiring(lic.validaAte);

                return (
                  <tr key={lic.id}>
                    <td>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                        {lic.licenseKey}
                      </code>
                    </td>
                    <td>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_COLORS[lic.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                        {lic.tipo}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={13} className="text-gray-400" />
                        {lic.anoFiscal}
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users size={13} className="text-gray-400" />
                        {lic.maxUsers}
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FileText size={13} className="text-gray-400" />
                        {lic.maxFaturas.toLocaleString()}
                      </div>
                    </td>
                    <td className="text-sm">
                      {lic.validaAte ? (
                        <span className={expired ? 'text-red-500' : expiring ? 'text-amber-600' : 'text-gray-600'}>
                          {expiring && <AlertTriangle size={12} className="inline mr-1" />}
                          {fmt.date(lic.validaAte)}
                        </span>
                      ) : (
                        <span className="text-purple-600 font-medium text-xs">Perpétua</span>
                      )}
                    </td>
                    <td>
                      {lic.ativa && !expired ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle size={12} /> Activa
                        </span>
                      ) : expired && lic.ativa ? (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                          <XCircle size={12} /> Expirada
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                          <ShieldOff size={12} /> Revogada
                        </span>
                      )}
                    </td>
                    {isAdmin() && (
                      <td className="text-center">
                        {lic.ativa && (
                          <button
                            onClick={() => {
                              if (confirm('Revogar esta licença?')) revoke.mutate(lic.id);
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            Revogar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create License Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Nova Licença</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <form
              onSubmit={e => { e.preventDefault(); create.mutate(); }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Tipo de Licença</label>
                  <select
                    className="form-input"
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Ano Fiscal</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.anoFiscal}
                    min={2020} max={2040}
                    onChange={e => setForm(f => ({ ...f, anoFiscal: +e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Máx. Utilizadores</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.maxUsers}
                    min={1}
                    onChange={e => setForm(f => ({ ...f, maxUsers: +e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Máx. Faturas</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.maxFaturas}
                    min={1}
                    onChange={e => setForm(f => ({ ...f, maxFaturas: +e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Válida Até (deixar vazio = perpétua)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.validaAte}
                    onChange={e => setForm(f => ({ ...f, validaAte: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Módulos</label>
                  <input
                    className="form-input"
                    placeholder="COMERCIAL,FINANCEIRO,STOCKS"
                    value={form.modulos}
                    onChange={e => setForm(f => ({ ...f, modulos: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Observações</label>
                  <textarea
                    className="form-input resize-none"
                    rows={2}
                    value={form.observacoes}
                    onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={create.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {create.isPending && <Loader2 size={14} className="animate-spin" />}
                  Gerar Licença
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
