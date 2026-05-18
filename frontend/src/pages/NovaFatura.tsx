import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { faturasApi } from '@/api/faturas';
import { clientesApi } from '@/api/clientes';
import { artigosApi } from '@/api/artigos';
import { fmt } from '@/utils/format';
import type { FaturaTipo } from '@/types';

interface Linha {
  artDescricao: string;
  artigoId?: number;
  artCodigo?: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  taxaIva: number;
}

const linhaVazia = (): Linha => ({
  artDescricao: '', unidade: 'UN', quantidade: 1,
  precoUnitario: 0, desconto: 0, taxaIva: 23,
});

interface Props { onBack: () => void; }

export default function NovaFatura({ onBack }: Props) {
  const hoje = new Date().toISOString().split('T')[0];

  const [tipo,           setTipo]           = useState<FaturaTipo>('FT');
  const [clienteId,      setClienteId]      = useState('');
  const [serie,          setSerie]          = useState('A');
  const [data,           setData]           = useState(hoje);
  const [dataVencimento, setDataVencimento] = useState('');
  const [condPagamento,  setCondPagamento]  = useState('');
  const [observacoes,    setObservacoes]    = useState('');
  const [linhas,         setLinhas]         = useState<Linha[]>([linhaVazia()]);
  const [saving,         setSaving]         = useState(false);

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-select'],
    queryFn:  () => clientesApi.list({ limit: 500 }),
  });
  const { data: artigosData } = useQuery({
    queryKey: ['artigos-select'],
    queryFn:  () => artigosApi.list({ limit: 500 }),
  });

  const updateLinha = (i: number, field: keyof Linha, value: unknown) => {
    setLinhas((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const handleArtigoChange = (i: number, artigoId: string) => {
    const artigo = artigosData?.data.find((a) => String(a.id) === artigoId);
    if (artigo) {
      setLinhas((prev) => prev.map((l, idx) => idx === i ? {
        ...l,
        artigoId:      artigo.id,
        artCodigo:     artigo.codigo,
        artDescricao:  artigo.descricao,
        precoUnitario: artigo.precoVenda,
        taxaIva:       artigo.taxaIva,
        unidade:       artigo.unidade,
      } : l));
    }
  };

  const calcTotais = () => {
    let subtotal = 0, totalIva = 0;
    linhas.forEach((l) => {
      const base = l.quantidade * l.precoUnitario * (1 - l.desconto / 100);
      subtotal  += base;
      totalIva  += base * (l.taxaIva / 100);
    });
    return { subtotal, totalIva, total: subtotal + totalIva };
  };
  const { subtotal, totalIva, total } = calcTotais();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) { toast.error('Selecione um cliente'); return; }
    if (linhas.some((l) => !l.artDescricao)) { toast.error('Preencha a descrição em todas as linhas'); return; }

    setSaving(true);
    try {
      await faturasApi.create({
        tipo, clienteId: Number(clienteId), serie, data,
        dataVencimento: dataVencimento || undefined,
        condPagamento:  condPagamento  || undefined,
        observacoes:    observacoes    || undefined,
        linhas: linhas.map((l) => ({
          artigoId:      l.artigoId,
          artCodigo:     l.artCodigo,
          artDescricao:  l.artDescricao,
          unidade:       l.unidade,
          quantidade:    l.quantidade,
          precoUnitario: l.precoUnitario,
          desconto:      l.desconto,
          taxaIva:       l.taxaIva,
        })),
      });
      toast.success('Fatura criada com sucesso');
      onBack();
    } catch {
      toast.error('Erro ao criar fatura');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nova Fatura</h1>
          <p className="text-sm text-gray-500">Preencha os dados do documento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Cabeçalho */}
        <div className="bg-white rounded-xl p-6 shadow-card">
          <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4">Dados do Documento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as FaturaTipo)} className="form-input">
                {[['FT','Fatura'],['FS','Fat. Simplif.'],['NC','Nota Crédito'],
                  ['ND','Nota Débito'],['RC','Recibo'],['OR','Orçamento'],['GT','Guia Transporte']
                ].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Série</label>
              <input value={serie} onChange={(e) => setSerie(e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="form-label">Data Emissão</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="form-label">Data Vencimento</label>
              <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="form-label">Cliente *</label>
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="form-input" required>
                <option value="">— Selecionar cliente —</option>
                {clientesData?.data.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Condições de Pagamento</label>
              <select value={condPagamento} onChange={(e) => setCondPagamento(e.target.value)} className="form-input">
                <option value="">— Selecionar —</option>
                {['Pronto Pagamento','15 Dias','30 Dias','45 Dias','60 Dias','90 Dias'].map(c =>
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Linhas */}
        <div className="bg-white rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Linhas</h3>
            <button type="button" onClick={() => setLinhas((prev) => [...prev, linhaVazia()])}
              className="flex items-center gap-1.5 text-sm text-indigo-600 font-semibold hover:text-indigo-800">
              <Plus size={14} /> Adicionar linha
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Artigo','Descrição','Qtd','P.Unit.','Desc.%','IVA%','Total',''].map(h =>
                    <th key={h} className="text-left px-2 py-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => {
                  const base       = l.quantidade * l.precoUnitario * (1 - l.desconto / 100);
                  const totalLinha = base * (1 + l.taxaIva / 100);
                  return (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-2 py-2 w-36">
                        <select className="form-input text-xs py-1.5"
                          onChange={(e) => handleArtigoChange(i, e.target.value)}>
                          <option value="">Artigo</option>
                          {artigosData?.data.map((a) => (
                            <option key={a.id} value={a.id}>{a.codigo} — {a.descricao}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input value={l.artDescricao}
                          onChange={(e) => updateLinha(i, 'artDescricao', e.target.value)}
                          className="form-input text-xs py-1.5" placeholder="Descrição" />
                      </td>
                      <td className="px-2 py-2 w-20">
                        <input type="number" step="0.001" min="0" value={l.quantidade}
                          onChange={(e) => updateLinha(i, 'quantidade', Number(e.target.value))}
                          className="form-input text-xs py-1.5 text-center" />
                      </td>
                      <td className="px-2 py-2 w-24">
                        <input type="number" step="0.01" min="0" value={l.precoUnitario}
                          onChange={(e) => updateLinha(i, 'precoUnitario', Number(e.target.value))}
                          className="form-input text-xs py-1.5 text-right" />
                      </td>
                      <td className="px-2 py-2 w-16">
                        <input type="number" step="0.01" min="0" max="100" value={l.desconto}
                          onChange={(e) => updateLinha(i, 'desconto', Number(e.target.value))}
                          className="form-input text-xs py-1.5 text-center" />
                      </td>
                      <td className="px-2 py-2 w-16">
                        <select value={l.taxaIva}
                          onChange={(e) => updateLinha(i, 'taxaIva', Number(e.target.value))}
                          className="form-input text-xs py-1.5">
                          {[0,6,13,23].map(t => <option key={t} value={t}>{t}%</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2 w-24 text-right font-semibold text-indigo-600">
                        {fmt.currency(totalLinha)}
                      </td>
                      <td className="px-2 py-2 w-8">
                        {linhas.length > 1 && (
                          <button type="button"
                            onClick={() => setLinhas((prev) => prev.filter((_, idx) => idx !== i))}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totais */}
          <div className="flex justify-end mt-4">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal:</span><span>{fmt.currency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>IVA:</span><span>{fmt.currency(totalIva)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-indigo-600 pt-2 border-t border-gray-200">
                <span>TOTAL:</span><span>{fmt.currency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl p-5 shadow-card">
          <label className="form-label">Observações</label>
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
            className="form-input resize-none" rows={3}
            placeholder="Observações ou notas de rodapé…" />
        </div>

        {/* Botões */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onBack} className="btn-ghost">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {saving ? 'A guardar…' : 'Emitir Fatura'}
          </button>
        </div>
      </form>
    </div>
  );
}
