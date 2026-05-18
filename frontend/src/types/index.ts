// ─── Auth ────────────────────────────────────────────────────
export interface JwtPayload {
  sub: number;
  email: string;
  tenantId: number;
  tenantSlug: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  tenantSlug?: string;
  tenantName?: string;
}

// ─── User ────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  tenantId: number;
  photoUrl?: string;
  active: boolean;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

// ─── Role ────────────────────────────────────────────────────
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string;
  createdAt: string;
}

// ─── Tenant ──────────────────────────────────────────────────
export interface Tenant {
  id: number;
  slug: string;
  name: string;
  plan: string;
  active: boolean;
  email?: string;
  nif?: string;
  nipc?: string;
  morada?: string;
  localidade?: string;
  codigoPostal?: string;
  pais?: string;
  telefone?: string;
  website?: string;
  maxUsers: number;
  licenseExpiresAt?: string;
}

// ─── Cliente ─────────────────────────────────────────────────
export interface Cliente {
  id: number;
  tenantId: number;
  nome: string;
  nif?: string;
  nipc?: string;
  email?: string;
  telefone?: string;
  telemovel?: string;
  morada?: string;
  localidade?: string;
  codigoPostal?: string;
  pais?: string;
  ativo: boolean;
  limiteCredito?: number;
  saldoDevedor?: number;
  observacoes?: string;
  createdAt: string;
}

export interface ClienteStats {
  totalFaturado: number;
  totalPendente: number;
  totalDocumentos: number;
}

// ─── Artigo ──────────────────────────────────────────────────
export interface Artigo {
  id: number;
  tenantId: number;
  codigo: string;
  descricao: string;
  unidade: string;
  precoCusto?: number;
  precoVenda: number;
  taxaIva: number;
  categoria?: string;
  subCategoria?: string;
  marca?: string;
  referencia?: string;
  codigoBarras?: string;
  stockAtual: number;
  stockMinimo: number;
  stockMaximo?: number;
  controlaStock: boolean;
  ativo: boolean;
  observacoes?: string;
  createdAt: string;
}

// ─── Fatura ──────────────────────────────────────────────────
export type FaturaTipo = 'FT' | 'FS' | 'NC' | 'ND' | 'RC' | 'OR' | 'GT';
export type FaturaStatus = 0 | 1 | 2 | 3 | 4 | 5;

export interface FaturaLinha {
  id?: number;
  faturaId?: number;
  tenantId?: number;
  artigoId?: number;
  artCodigo?: string;
  artDescricao: string;
  unidade?: string;
  quantidade: number;
  precoUnitario: number;
  desconto?: number;
  taxaIva: number;
  subtotal?: number;
  totalIva?: number;
  total?: number;
  observacoes?: string;
  ordem?: number;
}

export interface Fatura {
  id: number;
  tenantId: number;
  numero: string;
  serie: string;
  tipo: FaturaTipo;
  clienteId: number;
  clienteNome?: string;
  clienteNif?: string;
  data: string;
  dataVencimento?: string;
  subtotal: number;
  desconto: number;
  baseIva: number;
  totalIva: number;
  total: number;
  totalPago: number;
  saldo: number;
  moeda: string;
  status: FaturaStatus;
  observacoes?: string;
  condPagamento?: string;
  linhas?: FaturaLinha[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaturaDto {
  tipo: FaturaTipo;
  clienteId: number;
  serie?: string;
  data: string;
  dataVencimento?: string;
  condPagamento?: string;
  observacoes?: string;
  linhas: Omit<FaturaLinha, 'id' | 'faturaId' | 'tenantId' | 'subtotal' | 'totalIva' | 'total'>[];
}

// ─── Conta Corrente ──────────────────────────────────────────
export interface ExtratoLine {
  data: string;
  tipo: string;
  numero: string;
  descricao: string;
  debito: number;
  credito: number;
  saldo: number;
  faturaId: number;
}

export interface SaldoCliente {
  clienteId: number;
  clienteNome: string;
  clienteNif: string;
  totalFaturado: number;
  totalPago: number;
  saldoPendente: number;
  totalVencido: number;
  numDocumentos: number;
  ultimaFatura: string | null;
}

export interface DevedorItem {
  clienteId: number;
  clienteNome: string;
  clienteNif: string;
  valorVencido: number;
  valorPendente: number;
  diasAtraso: number;
  numDocumentos: number;
}

// ─── Dashboard ───────────────────────────────────────────────
export interface DashboardKpis {
  faturacaoMes:      number;
  recebimentosMes:   number;
  saldoPendente:     number;
  saldoVencido:      number;
  totalClientes:     number;
  clientesAtivos:    number;
  totalArtigos:      number;
  alertasStock:      number;
  docEmitidos:       number;
  docAnulados:       number;
  docVencidos:       number;
  evolucaoFaturacao: { mes: string; total: number }[];
  alertas:           DashboardAlerta[];
}

export interface DashboardAlerta {
  tipo:      string;
  nivel:     'danger' | 'warning' | 'info';
  titulo:    string;
  descricao: string;
  valor?:    number;
  link?:     string;
}

// ─── API Envelope ─────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Helpers ─────────────────────────────────────────────────
export const FATURA_STATUS_LABEL: Record<number, string> = {
  0: 'Rascunho', 1: 'Emitida', 2: 'Paga',
  3: 'Parcial',  4: 'Anulada', 5: 'Vencida',
};
export const FATURA_STATUS_CLASS: Record<number, string> = {
  0: 'badge-rascunho', 1: 'badge-emitida', 2: 'badge-paga',
  3: 'badge-parcial',  4: 'badge-anulada', 5: 'badge-vencida',
};
export const FATURA_TIPO_LABEL: Record<string, string> = {
  FT: 'Fatura', FS: 'Fat. Simplificada', NC: 'Nota de Crédito',
  ND: 'Nota de Débito', RC: 'Recibo', OR: 'Orçamento', GT: 'Guia Transp.',
};
