import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, unwrap } from '@/api/client';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import { useDebounce } from '@/hooks/useDebounce';
import { fmt } from '@/utils/format';
import type { User } from '@/types';

const usersApi = {
  list:   (params?: Record<string, unknown>) => api.get<{ data: { data: User[]; total: number } }>('/users', { params }).then(unwrap),
  update: (id: number, dto: Partial<User>)   => api.patch<{ data: User }>(`/users/${id}`, dto).then(unwrap),
  delete: (id: number)                        => api.delete(`/users/${id}`),
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [edit, setEdit]     = useState<User | null>(null);
  const debSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, debSearch],
    queryFn:  () => usersApi.list({ page, limit: 20, search: debSearch || undefined }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<User> }) => usersApi.update(id, dto),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['users'] }); setEdit(null); toast.success('Utilizador actualizado'); },
    onError:    () => toast.error('Erro ao actualizar'),
  });

  const deleteMut = useMutation({
    mutationFn: usersApi.delete,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('Utilizador eliminado'); },
    onError:    () => toast.error('Erro ao eliminar'),
  });

  const columns = [
    {
      key: 'name', label: 'Utilizador',
      render: (r: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-grad-brand flex items-center justify-center text-white text-xs font-bold">
            {fmt.initials(r.name)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{r.name}</p>
            <p className="text-xs text-gray-400">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles', label: 'Perfis',
      render: (r: User) => (
        <div className="flex flex-wrap gap-1">
          {r.roles?.map((role) => (
            <span key={role.id} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
              <ShieldCheck size={10} /> {role.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'active', label: 'Estado',
      render: (r: User) => (
        <span className={`badge ${r.active ? 'badge-emitida' : 'badge-anulada'}`}>
          {r.active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Criado em', render: (r: User) => fmt.date(r.createdAt) },
    {
      key: 'actions', label: '',
      render: (r: User) => (
        <div className="flex gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); setEdit(r); }}
            className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-indigo-500">
            <Pencil size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm('Eliminar utilizador?')) deleteMut.mutate(r.id); }}
            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Utilizadores</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} utilizadores</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar…" className="form-input pl-9" />
      </div>

      <Table
        columns={columns as unknown as Parameters<typeof Table>[0]['columns']}
        data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
        loading={isLoading}
        total={data?.total ?? 0}
        page={page} limit={20} onPageChange={setPage}
        emptyText="Nenhum utilizador"
      />

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Editar Utilizador"
        footer={
          <>
            <button onClick={() => setEdit(null)} className="btn-ghost">Cancelar</button>
            <button onClick={() => edit && updateMut.mutate({ id: edit.id, dto: { active: !edit.active } })}
              className="btn-primary">
              {edit?.active ? 'Desativar' : 'Ativar'}
            </button>
          </>
        }>
        {edit && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-gray-800">{edit.name}</p>
              <p className="text-sm text-gray-500">{edit.email}</p>
            </div>
            <p className="text-sm text-gray-600">
              Estado atual: <span className={`font-semibold ${edit.active ? 'text-green-600' : 'text-red-500'}`}>
                {edit.active ? 'Ativo' : 'Inativo'}
              </span>
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
