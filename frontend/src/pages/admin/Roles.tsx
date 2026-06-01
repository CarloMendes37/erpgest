import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { rolesApi } from '@/api/roles';
import type { Role } from '@/types';
import toast from 'react-hot-toast';

interface RoleForm {
  name: string;
  description: string;
}

const EMPTY_FORM: RoleForm = { name: '', description: '' };

export default function Roles() {
  const qc = useQueryClient();
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm]       = useState<RoleForm>(EMPTY_FORM);

  // ── queries ──────────────────────────────────────────────────
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
  });

  // ── mutations ────────────────────────────────────────────────
  const save = useMutation({
    mutationFn: () =>
      editing
        ? rolesApi.update(editing.id, form)
        : rolesApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
      toast.success(editing ? 'Role actualizada!' : 'Role criada!');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Erro ao guardar'),
  });

  // ── helpers ──────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal(true);
  }

  function openEdit(r: Role) {
    setEditing(r);
    setForm({ name: r.name, description: r.description ?? '' });
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    save.mutate();
  };

  // ── SYSTEM ROLES that should not be edited ───────────────────
  const SYSTEM_ROLES = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestão de Roles</h1>
            <p className="text-sm text-gray-500">Perfis de acesso e permissões do sistema</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova Role
        </button>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={36} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(roles as Role[]).map((role) => {
            const isSystem = SYSTEM_ROLES.includes(role.name);
            return (
              <div
                key={role.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Shield size={18} className="text-indigo-500" />
                  </div>
                  {isSystem ? (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                      Sistema
                    </span>
                  ) : (
                    <button
                      onClick={() => openEdit(role)}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>

                <h3 className="font-semibold text-gray-800 text-sm">{role.name}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {role.description || (
                    <span className="italic text-gray-300">Sem descrição</span>
                  )}
                </p>

                {isSystem && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
                    <AlertCircle size={12} />
                    <span>Role do sistema — não editável</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 text-sm mb-1">Como funcionam as Roles?</h4>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li><strong>ROLE_ADMIN</strong> — Acesso total ao sistema, gestão de utilizadores e configurações</li>
          <li><strong>ROLE_MANAGER</strong> — Acesso a relatórios, aprovações e gestão comercial</li>
          <li><strong>ROLE_USER</strong> — Operações do dia-a-dia: clientes, artigos, faturação</li>
          <li>Roles personalizadas podem ser criadas para necessidades específicas</li>
        </ul>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">
                {editing ? 'Editar Role' : 'Nova Role'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Nome da Role <span className="text-red-500">*</span></label>
                <input
                  className="form-input"
                  placeholder="Ex: ROLE_FINANCEIRO"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Formato: ROLE_NOME (maiúsculas, sem espaços)</p>
              </div>

              <div>
                <label className="form-label">Descrição</label>
                <textarea
                  className="form-input resize-none"
                  rows={3}
                  placeholder="Descreva as permissões desta role..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
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
                  {editing ? 'Guardar' : 'Criar Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
