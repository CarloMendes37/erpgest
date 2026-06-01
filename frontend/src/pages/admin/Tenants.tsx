import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Plus, Edit2, ToggleLeft, ToggleRight,
  Loader2, Search, Globe, CheckCircle, XCircle,
} from 'lucide-react';
import { tenantsApi } from '@/api/tenants';
import type { Tenant } from '@/types';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

interface TenantForm {
  slug: string;
  name: string;
  email: string;
  nif: string;
  nipc: string;
  morada: string;
  plan: string;
}

const EMPTY_FORM: TenantForm = {
  slug: '', name: '', email: '', nif: '', nipc: '', morada: '', plan: 'FREE',
};

const PLANS = ['FREE', 'PRO', 'ENTERPRISE'];
const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  PRO: 'bg-blue-100 text-blue-700',
  ENTERPRISE: 'bg-purple-100 text-purple-700',
};

export default function Tenants() {
  const qc = useQueryClient();
  const { isAdmin } = useAuthStore();
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm]       = useState<TenantForm>(EMPTY_FORM);
  const [search, setSearch]   = useState('');

  // ── guard ────────────────────────────────────────────────────
  if (!isAdmin()) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
        <XCircle size={48} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-red-700">Acesso Negado</h2>
        <p className="text-sm text-red-500 mt-1">Esta área é exclusiva para administradores do sistema.</p>
      </div>
    );
  }

  // ── queries ──────────────────────────────────────────────────
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.list(),
  });

  // ── mutations ────────────────────────────────────────────────
  const save = useMutation({
    mutationFn: () =>
      editing
        ? tenantsApi.update(editing.id, form)
        : tenantsApi.create({ ...form, schemaName: form.slug }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      closeModal();
      toast.success(editing ? 'Tenant actualizado!' : 'Tenant criado!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar'),
  });

  const toggle = useMutation({
    mutationFn: (id: number) => tenantsApi.toggleActive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Estado alterado!');
    },
    onError: () => toast.error('Erro ao alterar estado'),
  });

  // ── helpers ──────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal(true);
  }

  function openEdit(t: Tenant) {
    setEditing(t);
    setForm({
      slug: t.slug, name: t.name, email: t.email ?? '',
      nif: t.nif ?? '', nipc: t.nipc ?? '',
      morada: t.morada ?? '', plan: t.plan ?? 'FREE',
    });
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;
    save.mutate();
  };

  const filtered = (tenants as Tenant[]).filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestão de Tenants</h1>
            <p className="text-sm text-gray-500">Organizações registadas no sistema</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Tenant
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: (tenants as Tenant[]).length, color: 'text-gray-700' },
          { label: 'Activos', value: (tenants as Tenant[]).filter(t => t.active).length, color: 'text-green-600' },
          { label: 'Inativos', value: (tenants as Tenant[]).filter(t => !t.active).length, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="form-input pl-9"
          placeholder="Pesquisar por nome ou slug..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-indigo-500" size={36} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Globe size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum tenant encontrado</p>
          </div>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Organização</th>
                <th>Slug</th>
                <th>Email</th>
                <th>NIF / NIPC</th>
                <th>Plano</th>
                <th>Estado</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.morada || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{t.slug}</code>
                  </td>
                  <td className="text-sm text-gray-600">{t.email || '—'}</td>
                  <td className="text-sm text-gray-600">
                    {t.nif && <div>NIF: {t.nif}</div>}
                    {t.nipc && <div>NIPC: {t.nipc}</div>}
                    {!t.nif && !t.nipc && '—'}
                  </td>
                  <td>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[t.plan] || 'bg-gray-100 text-gray-600'}`}>
                      {t.plan}
                    </span>
                  </td>
                  <td>
                    {t.active ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle size={13} /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                        <XCircle size={13} /> Inativo
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => toggle.mutate(t.id)}
                        disabled={toggle.isPending}
                        className={`transition-colors ${t.active ? 'text-green-500 hover:text-red-500' : 'text-gray-300 hover:text-green-500'}`}
                        title={t.active ? 'Desativar' : 'Ativar'}
                      >
                        {t.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-box max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">
                {editing ? `Editar: ${editing.name}` : 'Novo Tenant'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nome da Organização <span className="text-red-500">*</span></label>
                  <input
                    className="form-input"
                    placeholder="Ex: Empresa ABC, Lda"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Slug (identificador) <span className="text-red-500">*</span></label>
                  <input
                    className="form-input"
                    placeholder="empresa-abc"
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                    disabled={!!editing}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Apenas letras minúsculas, números e hífens</p>
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="geral@empresa.pt"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Plano</label>
                  <select
                    className="form-input"
                    value={form.plan}
                    onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                  >
                    {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">NIF</label>
                  <input
                    className="form-input"
                    placeholder="123456789"
                    value={form.nif}
                    onChange={e => setForm(f => ({ ...f, nif: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">NIPC</label>
                  <input
                    className="form-input"
                    placeholder="500000000"
                    value={form.nipc}
                    onChange={e => setForm(f => ({ ...f, nipc: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Morada Fiscal</label>
                  <input
                    className="form-input"
                    placeholder="Rua Principal, nº1, 1000-001 Lisboa"
                    value={form.morada}
                    onChange={e => setForm(f => ({ ...f, morada: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-ghost flex-1">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={save.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {save.isPending && <Loader2 size={14} className="animate-spin" />}
                  {editing ? 'Guardar Alterações' : 'Criar Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
