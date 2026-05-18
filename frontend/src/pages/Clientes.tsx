import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2, User, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientesApi } from '@/api/clientes';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import { useDebounce } from '@/hooks/useDebounce';
import type { Cliente } from '@/types';

const schema = z.object({
  nome:         z.string().min(2, 'Nome obrigatório'),
  nif:          z.string().optional(),
  email:        z.string().email('Email inválido').or(z.literal('').optional()),
  telefone:     z.string().optional(),
  telemovel:    z.string().optional(),
  morada:       z.string().optional(),
  localidade:   z.string().optional(),
  codigoPostal: z.string().optional(),
  pais:         z.string().optional(),
  observacoes:  z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ClientesPage() {
  const qc = useQueryClient();
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Cliente | null>(null);
  const debSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', page, debSearch],
    queryFn:  () => clientesApi.list({ page, limit: 20, search: debSearch || undefined }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: clientesApi.create,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['clientes'] }); closeModal(); toast.success('Cliente criado'); },
    onError:    () => toast.error('Erro ao criar cliente'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<Cliente> }) => clientesApi.update(id, dto),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['clientes'] }); closeModal(); toast.success('Cliente actualizado'); },
    onError:    () => toast.error('Erro ao actualizar'),
  });
  const deleteMut = useMutation({
    mutationFn: clientesApi.delete,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente eliminado'); },
    onError:    () => toast.error('Erro ao eliminar'),
  });

  const openCreate = () => { reset({}); setSelected(null); setModal('create'); };
  const openEdit   = (c: Cliente) => { setSelected(c); reset(c as FormData); setModal('edit'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const onSubmit = (data: FormData) => {
    if (modal === 'create') createMut.mutate(data);
    else if (selected)      updateMut.mutate({ id: selected.id, dto: data });
  };

  const confirmDelete = (id: number) => {
    if (confirm('Eliminar este cliente?')) deleteMut.mutate(id);
  };

  const columns = [
    {
      key: 'nome', label: 'Cliente',
      render: (r: Cliente) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-grad-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {r.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{r.nome}</p>
            {r.nif && <p className="text-xs text-gray-400">NIF: {r.nif}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'email', label: 'Contacto',
      render: (r: Cliente) => (
        <div className="space-y-0.5">
          {r.email    && <p className="flex items-center gap-1 text-xs text-gray-600"><Mail size={11}/>{r.email}</p>}
          {r.telefone && <p className="flex items-center gap-1 text-xs text-gray-600"><Phone size={11}/>{r.telefone}</p>}
        </div>
      ),
    },
    {
      key: 'localidade', label: 'Localidade',
      render: (r: Cliente) => (
        <span className="flex items-center gap-1 text-sm text-gray-600">
          {r.localidade && <><MapPin size={12} className="text-gray-400"/>{r.localidade}</>}
        </span>
      ),
    },
    {
      key: 'ativo', label: 'Estado',
      render: (r: Cliente) => (
        <span className={`badge ${r.ativo ? 'badge-emitida' : 'badge-anulada'}`}>
          {r.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'actions', label: '',
      render: (r: Cliente) => (
        <div className="flex gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-indigo-500 transition">
            <Pencil size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); confirmDelete(r.id); }}
            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 transition">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} clientes registados</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Pesquisar clientes…"
          className="form-input pl-9"
        />
      </div>

      <Table
        columns={columns as Parameters<typeof Table>[0]['columns']}
        data={(data?.data ?? []) as Record<string, unknown>[]}
        loading={isLoading}
        total={data?.total ?? 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        emptyText="Nenhum cliente encontrado"
      />

      {/* Modal create/edit */}
      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal === 'create' ? 'Novo Cliente' : 'Editar Cliente'}
        size="lg"
        footer={
          <>
            <button onClick={closeModal} className="btn-ghost">Cancelar</button>
            <button onClick={handleSubmit(onSubmit)} className="btn-primary">
              {modal === 'create' ? 'Criar Cliente' : 'Guardar Alterações'}
            </button>
          </>
        }
      >
        <form className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label"><User size={13} className="inline mr-1"/>Nome *</label>
            <input {...register('nome')} className="form-input" placeholder="Nome do cliente" />
            {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className="form-label">NIF</label>
            <input {...register('nif')} className="form-input" placeholder="123456789" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input {...register('email')} type="email" className="form-input" placeholder="email@empresa.pt" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="form-label">Telefone</label>
            <input {...register('telefone')} className="form-input" placeholder="21 000 0000" />
          </div>
          <div>
            <label className="form-label">Telemóvel</label>
            <input {...register('telemovel')} className="form-input" placeholder="91 000 0000" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Morada</label>
            <input {...register('morada')} className="form-input" placeholder="Rua, número" />
          </div>
          <div>
            <label className="form-label">Localidade</label>
            <input {...register('localidade')} className="form-input" placeholder="Lisboa" />
          </div>
          <div>
            <label className="form-label">Código Postal</label>
            <input {...register('codigoPostal')} className="form-input" placeholder="1000-001" />
          </div>
          <div>
            <label className="form-label">País</label>
            <input {...register('pais')} className="form-input" defaultValue="Portugal" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Observações</label>
            <textarea {...register('observacoes')} className="form-input resize-none" rows={2} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
