import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Pencil, Trash2, AlertTriangle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { artigosApi } from '@/api/artigos';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import { useDebounce } from '@/hooks/useDebounce';
import { fmt } from '@/utils/format';
import type { Artigo } from '@/types';

const schema = z.object({
  codigo:        z.string().min(1, 'Código obrigatório'),
  descricao:     z.string().min(2, 'Descrição obrigatória'),
  unidade:       z.string().default('UN'),
  precoVenda:    z.coerce.number().min(0),
  taxaIva:       z.coerce.number().min(0).max(100).default(23),
  precoCusto:    z.coerce.number().optional(),
  categoria:     z.string().optional(),
  stockAtual:    z.coerce.number().default(0),
  stockMinimo:   z.coerce.number().default(0),
  stockMaximo:   z.coerce.number().optional(),
  controlaStock: z.boolean().default(true),
  ativo:         z.boolean().default(true),
  codigoBarras:  z.string().optional(),
  observacoes:   z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ArtigosPage() {
  const qc = useQueryClient();
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Artigo | null>(null);
  const [alertaOnly, setAlertaOnly] = useState(false);
  const debSearch = useDebounce(search);

  const { data, isLoading } = useQuery({
    queryKey: ['artigos', page, debSearch, alertaOnly],
    queryFn:  () => artigosApi.list({
      page, limit: 20,
      search: debSearch || undefined,
      alertaStock: alertaOnly || undefined,
    }),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { taxaIva: 23, stockAtual: 0, stockMinimo: 0, unidade: 'UN', controlaStock: true, ativo: true },
  });

  const createMut = useMutation({
    mutationFn: artigosApi.create,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['artigos'] }); closeModal(); toast.success('Artigo criado'); },
    onError:    () => toast.error('Erro ao criar artigo'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<Artigo> }) => artigosApi.update(id, dto),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['artigos'] }); closeModal(); toast.success('Artigo actualizado'); },
    onError:    () => toast.error('Erro ao actualizar'),
  });
  const deleteMut = useMutation({
    mutationFn: artigosApi.delete,
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['artigos'] }); toast.success('Artigo eliminado'); },
    onError:    () => toast.error('Erro ao eliminar'),
  });

  const openCreate = () => {
    reset({ taxaIva: 23, stockAtual: 0, stockMinimo: 0, unidade: 'UN', controlaStock: true, ativo: true });
    setSelected(null); setModal('create');
  };
  const openEdit   = (a: Artigo) => { setSelected(a); reset(a as unknown as FormData); setModal('edit'); };
  const closeModal = () => { setModal(null); setSelected(null); };
  const onSubmit   = (data: FormData) => {
    if (modal === 'create') createMut.mutate(data);
    else if (selected)      updateMut.mutate({ id: selected.id, dto: data });
  };

  const columns = [
    {
      key: 'codigo', label: 'Artigo',
      render: (r: Artigo) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
            <Package size={16} className="text-purple-500" />
          </div>
          <div>
            <p className="font-mono text-xs text-gray-500">{r.codigo}</p>
            <p className="font-semibold text-gray-800 text-sm">{r.descricao}</p>
          </div>
        </div>
      ),
    },
    { key: 'categoria', label: 'Categoria',
      render: (r: Artigo) => <span className="text-sm text-gray-600">{r.categoria ?? '—'}</span> },
    { key: 'precoVenda', label: 'Preço Venda', align: 'right' as const,
      render: (r: Artigo) => <span className="font-semibold text-indigo-600">{fmt.currency(r.precoVenda)}</span> },
    { key: 'taxaIva', label: 'IVA', align: 'center' as const,
      render: (r: Artigo) => <span className="text-sm text-gray-600">{r.taxaIva}%</span> },
    {
      key: 'stockAtual', label: 'Stock', align: 'center' as const,
      render: (r: Artigo) => {
        const low = r.controlaStock && r.stockAtual <= r.stockMinimo;
        return (
          <span className={`flex items-center justify-center gap-1 font-bold text-sm
            ${low ? 'text-red-500' : 'text-gray-700'}`}>
            {low && <AlertTriangle size={12} />}
            {r.stockAtual} {r.unidade}
          </span>
        );
      },
    },
    {
      key: 'ativo', label: 'Estado',
      render: (r: Artigo) => (
        <span className={`badge ${r.ativo ? 'badge-emitida' : 'badge-anulada'}`}>
          {r.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'actions', label: '',
      render: (r: Artigo) => (
        <div className="flex gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-indigo-500">
            <Pencil size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm('Eliminar artigo?')) deleteMut.mutate(r.id); }}
            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400">
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
          <h1 className="text-2xl font-bold text-gray-800">Artigos</h1>
          <p className="text-sm text-gray-500">{data?.total ?? 0} artigos</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Artigo
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Pesquisar artigos…"
            className="form-input pl-9"
          />
        </div>
        <button
          onClick={() => setAlertaOnly((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition
            ${alertaOnly ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'}`}
        >
          <AlertTriangle size={14} /> Stock baixo
        </button>
      </div>

      <Table
        columns={columns as Parameters<typeof Table>[0]['columns']}
        data={(data?.data ?? []) as Record<string, unknown>[]}
        loading={isLoading}
        total={data?.total ?? 0}
        page={page}
        limit={20}
        onPageChange={setPage}
        emptyText="Nenhum artigo encontrado"
      />

      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal === 'create' ? 'Novo Artigo' : 'Editar Artigo'}
        size="lg"
        footer={
          <>
            <button onClick={closeModal} className="btn-ghost">Cancelar</button>
            <button onClick={handleSubmit(onSubmit)} className="btn-primary">
              {modal === 'create' ? 'Criar Artigo' : 'Guardar'}
            </button>
          </>
        }
      >
        <form className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Código *</label>
            <input {...register('codigo')} className="form-input font-mono" placeholder="ART001" />
            {errors.codigo && <p className="text-xs text-red-500 mt-1">{errors.codigo.message}</p>}
          </div>
          <div>
            <label className="form-label">Unidade</label>
            <select {...register('unidade')} className="form-input">
              {['UN', 'KG', 'LT', 'M', 'M2', 'M3', 'CX', 'HR', 'SV'].map(u =>
                <option key={u} value={u}>{u}</option>
              )}
            </select>
          </div>
          <div className="col-span-2">
            <label className="form-label">Descrição *</label>
            <input {...register('descricao')} className="form-input" placeholder="Descrição do artigo" />
            {errors.descricao && <p className="text-xs text-red-500 mt-1">{errors.descricao.message}</p>}
          </div>
          <div>
            <label className="form-label">Preço de Venda (€) *</label>
            <input {...register('precoVenda')} type="number" step="0.01" className="form-input" />
            {errors.precoVenda && <p className="text-xs text-red-500 mt-1">{errors.precoVenda.message}</p>}
          </div>
          <div>
            <label className="form-label">Taxa IVA (%)</label>
            <select {...register('taxaIva')} className="form-input">
              {[0, 6, 13, 23].map(t => <option key={t} value={t}>{t}%</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Preço de Custo (€)</label>
            <input {...register('precoCusto')} type="number" step="0.01" className="form-input" />
          </div>
          <div>
            <label className="form-label">Categoria</label>
            <input {...register('categoria')} className="form-input" placeholder="Categoria" />
          </div>
          <div>
            <label className="form-label">Stock Atual</label>
            <input {...register('stockAtual')} type="number" className="form-input" />
          </div>
          <div>
            <label className="form-label">Stock Mínimo</label>
            <input {...register('stockMinimo')} type="number" className="form-input" />
          </div>
          <div className="col-span-2">
            <label className="form-label">Código de Barras</label>
            <input {...register('codigoBarras')} className="form-input font-mono" placeholder="EAN13" />
          </div>
          <div className="col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('controlaStock')} className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-600">Controla stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('ativo')} className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-600">Ativo</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
