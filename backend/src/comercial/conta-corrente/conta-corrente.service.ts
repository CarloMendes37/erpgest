import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Fatura } from '../faturas/fatura.entity';
import { Cliente } from '../clientes/cliente.entity';

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

export interface ExtratoResult {
  cliente: {
    id: number;
    nome: string;
    nif: string;
    email: string;
    telefone: string;
  };
  periodo: { dataInicio: string; dataFim: string };
  saldoInicial: number;
  totalDebito: number;
  totalCredito: number;
  saldoFinal: number;
  linhas: ExtratoLine[];
}

@Injectable()
export class ContaCorrenteService {
  constructor(
    @InjectRepository(Fatura)
    private readonly faturaRepo: Repository<Fatura>,
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────────────────────────
  //  EXTRATO DE CONTA CORRENTE DO CLIENTE
  // ─────────────────────────────────────────────────────────────
  async getExtrato(
    tenantId: number,
    clienteId: number,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<ExtratoResult> {
    const cliente = await this.clienteRepo.findOne({
      where: { id: clienteId, tenantId },
    });
    if (!cliente) throw new NotFoundException(`Cliente ${clienteId} não encontrado`);

    const inicio = dataInicio ?? new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const fim = dataFim ?? new Date().toISOString().split('T')[0];

    // Buscar todos os documentos do cliente no período
    const faturas = await this.faturaRepo
      .createQueryBuilder('f')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.clienteId = :clienteId', { clienteId })
      .andWhere('f.data >= :inicio', { inicio })
      .andWhere('f.data <= :fim', { fim })
      .andWhere('f.status != 4') // excluir anuladas
      .orderBy('f.data', 'ASC')
      .addOrderBy('f.id', 'ASC')
      .getMany();

    // Construir extrato com saldo acumulado
    let saldoAcumulado = 0;
    let totalDebito = 0;
    let totalCredito = 0;

    const linhas: ExtratoLine[] = faturas.map((fat) => {
      let debito = 0;
      let credito = 0;
      let descricao = '';

      if (['FT', 'FS', 'ND'].includes(fat.tipo)) {
        // Documentos que aumentam dívida
        debito = Number(fat.total);
        credito = Number(fat.totalPago);
        descricao = this.getTipoLabel(fat.tipo) + ' ' + fat.numero;
      } else if (['NC', 'RC'].includes(fat.tipo)) {
        // Notas de crédito e recibos diminuem dívida
        credito = Number(fat.total);
        descricao = this.getTipoLabel(fat.tipo) + ' ' + fat.numero;
      }

      totalDebito += debito;
      totalCredito += credito;
      saldoAcumulado += debito - credito;

      return {
        data: fat.data,
        tipo: fat.tipo,
        numero: fat.numero,
        descricao,
        debito,
        credito,
        saldo: Number(saldoAcumulado.toFixed(2)),
        faturaId: fat.id,
      };
    });

    return {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        nif: cliente.nif ?? '',
        email: cliente.email ?? '',
        telefone: cliente.telefone ?? '',
      },
      periodo: { dataInicio: inicio, dataFim: fim },
      saldoInicial: 0,
      totalDebito: Number(totalDebito.toFixed(2)),
      totalCredito: Number(totalCredito.toFixed(2)),
      saldoFinal: Number(saldoAcumulado.toFixed(2)),
      linhas,
    };
  }

  // ─────────────────────────────────────────────────────────────
  //  SALDOS DE TODOS OS CLIENTES
  // ─────────────────────────────────────────────────────────────
  async getSaldos(
    tenantId: number,
    options?: {
      apenasComSaldo?: boolean;
      page?: number;
      limit?: number;
      search?: string;
    },
  ): Promise<{ data: SaldoCliente[]; total: number; pendente: number; vencido: number }> {
    const { apenasComSaldo = false, page = 1, limit = 50, search } = options ?? {};

    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        'c.id           AS clienteId',
        'c.nome         AS clienteNome',
        'c.nif          AS clienteNif',
        'COALESCE(SUM(CASE WHEN f.tipo IN ("FT","FS","ND") AND f.status != 4 THEN f.total  ELSE 0 END), 0) AS totalFaturado',
        'COALESCE(SUM(CASE WHEN f.status != 4 THEN f.total_pago ELSE 0 END), 0)                            AS totalPago',
        'COALESCE(SUM(CASE WHEN f.status IN (1,3,5) THEN f.saldo ELSE 0 END), 0)                           AS saldoPendente',
        'COALESCE(SUM(CASE WHEN f.status = 5 THEN f.saldo ELSE 0 END), 0)                                  AS totalVencido',
        'COUNT(f.id)    AS numDocumentos',
        'MAX(f.data)    AS ultimaFatura',
      ])
      .from('com_cliente', 'c')
      .leftJoin(
        'com_fatura',
        'f',
        'f.cliente_id = c.id AND f.tenant_id = c.tenant_id',
      )
      .where('c.tenant_id = :tenantId', { tenantId })
      .groupBy('c.id, c.nome, c.nif');

    if (search) {
      qb.andWhere('(c.nome LIKE :s OR c.nif LIKE :s OR c.email LIKE :s)', {
        s: `%${search}%`,
      });
    }
    if (apenasComSaldo) {
      qb.having('saldoPendente > 0');
    }

    const allRows: any[] = await qb.getRawMany();
    const total = allRows.length;
    const totalPendente = allRows.reduce((a, r) => a + Number(r.saldoPendente), 0);
    const totalVencido = allRows.reduce((a, r) => a + Number(r.totalVencido), 0);

    const paginated = allRows.slice((page - 1) * limit, page * limit);

    const data: SaldoCliente[] = paginated.map((r) => ({
      clienteId:      Number(r.clienteId),
      clienteNome:    r.clienteNome,
      clienteNif:     r.clienteNif ?? '',
      totalFaturado:  Number(Number(r.totalFaturado).toFixed(2)),
      totalPago:      Number(Number(r.totalPago).toFixed(2)),
      saldoPendente:  Number(Number(r.saldoPendente).toFixed(2)),
      totalVencido:   Number(Number(r.totalVencido).toFixed(2)),
      numDocumentos:  Number(r.numDocumentos),
      ultimaFatura:   r.ultimaFatura ?? null,
    }));

    return {
      data,
      total,
      pendente: Number(totalPendente.toFixed(2)),
      vencido:  Number(totalVencido.toFixed(2)),
    };
  }

  // ─────────────────────────────────────────────────────────────
  //  MAPA DE DEVEDORES (aging / antiguidade de saldos)
  // ─────────────────────────────────────────────────────────────
  async getDevedores(
    tenantId: number,
    limite?: number,
  ): Promise<{ devedores: DevedorItem[]; totalVencido: number; totalPendente: number }> {
    const hoje = new Date().toISOString().split('T')[0];

    const rows: any[] = await this.dataSource
      .createQueryBuilder()
      .select([
        'c.id                                                         AS clienteId',
        'c.nome                                                       AS clienteNome',
        'c.nif                                                        AS clienteNif',
        'SUM(CASE WHEN f.data_vencimento < :hoje AND f.status IN (1,3,5) THEN f.saldo ELSE 0 END) AS valorVencido',
        'SUM(CASE WHEN f.status IN (1,3,5) THEN f.saldo ELSE 0 END)  AS valorPendente',
        'COALESCE(MAX(DATEDIFF(:hoje, f.data_vencimento)), 0)         AS diasAtraso',
        'COUNT(CASE WHEN f.status IN (1,3,5) THEN 1 END)             AS numDocumentos',
      ])
      .from('com_cliente', 'c')
      .innerJoin(
        'com_fatura',
        'f',
        'f.cliente_id = c.id AND f.tenant_id = c.tenant_id AND f.status IN (1,3,5)',
      )
      .where('c.tenant_id = :tenantId', { tenantId })
      .setParameter('hoje', hoje)
      .groupBy('c.id, c.nome, c.nif')
      .having('valorPendente > 0')
      .orderBy('valorVencido', 'DESC')
      .limit(limite ?? 100)
      .getRawMany();

    const totalVencido  = rows.reduce((a, r) => a + Number(r.valorVencido), 0);
    const totalPendente = rows.reduce((a, r) => a + Number(r.valorPendente), 0);

    const devedores: DevedorItem[] = rows.map((r) => ({
      clienteId:     Number(r.clienteId),
      clienteNome:   r.clienteNome,
      clienteNif:    r.clienteNif ?? '',
      valorVencido:  Number(Number(r.valorVencido).toFixed(2)),
      valorPendente: Number(Number(r.valorPendente).toFixed(2)),
      diasAtraso:    Number(r.diasAtraso),
      numDocumentos: Number(r.numDocumentos),
    }));

    return {
      devedores,
      totalVencido:  Number(totalVencido.toFixed(2)),
      totalPendente: Number(totalPendente.toFixed(2)),
    };
  }

  // ─────────────────────────────────────────────────────────────
  //  DOCUMENTOS PENDENTES DO CLIENTE
  // ─────────────────────────────────────────────────────────────
  async getPendentesCliente(
    tenantId: number,
    clienteId: number,
  ): Promise<{ faturas: Fatura[]; totalPendente: number; totalVencido: number }> {
    const cliente = await this.clienteRepo.findOne({
      where: { id: clienteId, tenantId },
    });
    if (!cliente) throw new NotFoundException(`Cliente ${clienteId} não encontrado`);

    const faturas = await this.faturaRepo
      .createQueryBuilder('f')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.clienteId = :clienteId', { clienteId })
      .andWhere('f.status IN (:...statuses)', { statuses: [1, 3, 5] })
      .orderBy('f.dataVencimento', 'ASC')
      .getMany();

    const hoje = new Date().toISOString().split('T')[0];
    const totalPendente = faturas.reduce((a, f) => a + Number(f.saldo), 0);
    const totalVencido  = faturas
      .filter((f) => f.dataVencimento && f.dataVencimento < hoje)
      .reduce((a, f) => a + Number(f.saldo), 0);

    return {
      faturas,
      totalPendente: Number(totalPendente.toFixed(2)),
      totalVencido:  Number(totalVencido.toFixed(2)),
    };
  }

  // ─────────────────────────────────────────────────────────────
  //  RESUMO GLOBAL DE CONTA CORRENTE (para dashboard)
  // ─────────────────────────────────────────────────────────────
  async getResumoGlobal(tenantId: number): Promise<{
    totalClientes: number;
    clientesComSaldo: number;
    totalPendente: number;
    totalVencido: number;
    ticketMedioPendente: number;
  }> {
    const rows: any[] = await this.dataSource
      .createQueryBuilder()
      .select([
        'COUNT(DISTINCT c.id)                                                     AS totalClientes',
        'COUNT(DISTINCT CASE WHEN f.saldo > 0 AND f.status IN (1,3,5) THEN c.id END) AS clientesComSaldo',
        'COALESCE(SUM(CASE WHEN f.status IN (1,3,5) THEN f.saldo ELSE 0 END), 0) AS totalPendente',
        'COALESCE(SUM(CASE WHEN f.status = 5       THEN f.saldo ELSE 0 END), 0)  AS totalVencido',
      ])
      .from('com_cliente', 'c')
      .leftJoin(
        'com_fatura',
        'f',
        'f.cliente_id = c.id AND f.tenant_id = c.tenant_id',
      )
      .where('c.tenant_id = :tenantId', { tenantId })
      .getRawMany();

    const r = rows[0] ?? {};
    const totalClientes       = Number(r.totalClientes ?? 0);
    const clientesComSaldo    = Number(r.clientesComSaldo ?? 0);
    const totalPendente       = Number(Number(r.totalPendente ?? 0).toFixed(2));
    const totalVencido        = Number(Number(r.totalVencido ?? 0).toFixed(2));
    const ticketMedioPendente = clientesComSaldo > 0
      ? Number((totalPendente / clientesComSaldo).toFixed(2))
      : 0;

    return { totalClientes, clientesComSaldo, totalPendente, totalVencido, ticketMedioPendente };
  }

  // ─────────────────────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────────────────────
  private getTipoLabel(tipo: string): string {
    const map: Record<string, string> = {
      FT: 'Fatura', FS: 'Fatura Simplificada',
      NC: 'Nota de Crédito', ND: 'Nota de Débito',
      RC: 'Recibo', OR: 'Orçamento', GT: 'Guia de Transporte',
    };
    return map[tipo] ?? tipo;
  }
}
