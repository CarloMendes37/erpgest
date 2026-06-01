import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Fatura } from '../faturas/fatura.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Artigo } from '../artigos/artigo.entity';

export interface KpiComercial {
  // Faturação
  faturacaoMes:        number;
  faturacaoMesAnterior: number;
  variacaoFaturacao:   number; // %

  // Documentos pendentes
  totalPendente:       number;
  numDocPendentes:     number;
  totalVencido:        number;
  numDocVencidos:      number;

  // Clientes
  totalClientes:       number;
  novosClientesMes:    number;

  // Artigos / Stock
  totalArtigos:        number;
  artigosStockBaixo:   number;

  // Top 5 clientes do mês
  topClientes: { clienteId: number; nome: string; total: number }[];

  // Faturação por tipo (mês atual)
  porTipo: { tipo: string; total: number; count: number }[];

  // Faturação diária (últimos 30 dias)
  faturacaoDiaria: { data: string; total: number; count: number }[];

  // Evolução mensal (últimos 12 meses)
  evolucaoMensal: { mes: string; total: number; pago: number }[];
}

@Injectable()
export class DashboardComercialService {
  constructor(
    @InjectRepository(Fatura)
    private readonly faturaRepo: Repository<Fatura>,
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(Artigo)
    private readonly artigoRepo: Repository<Artigo>,
    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────────────────────────
  //  KPIs PRINCIPAIS DO DASHBOARD COMERCIAL
  // ─────────────────────────────────────────────────────────────
  async getKpis(tenantId: number): Promise<KpiComercial> {
    const hoje       = new Date();
    const anoAtual   = hoje.getFullYear();
    const mesAtual   = hoje.getMonth() + 1;
    const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
    const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual;

    const [
      faturacaoMes,
      faturacaoMesAnterior,
      pendentes,
      totalClientes,
      novosClientesMes,
      totalArtigos,
      artigosStockBaixo,
      topClientes,
      porTipo,
      faturacaoDiaria,
      evolucaoMensal,
    ] = await Promise.all([
      this.getFaturacaoMes(tenantId, anoAtual, mesAtual),
      this.getFaturacaoMes(tenantId, anoAnterior, mesAnterior),
      this.getPendentesResumo(tenantId),
      this.clienteRepo.count({ where: { tenantId } }),
      this.getNovosClientesMes(tenantId, anoAtual, mesAtual),
      this.artigoRepo.count({ where: { tenantId, ativo: true } }),
      this.getArtigosStockBaixo(tenantId),
      this.getTopClientes(tenantId, anoAtual, mesAtual, 5),
      this.getFaturacaoPorTipo(tenantId, anoAtual, mesAtual),
      this.getFaturacaoDiaria(tenantId, 30),
      this.getEvolucaoMensal(tenantId, 12),
    ]);

    const variacaoFaturacao = faturacaoMesAnterior > 0
      ? Number((((faturacaoMes - faturacaoMesAnterior) / faturacaoMesAnterior) * 100).toFixed(1))
      : 0;

    return {
      faturacaoMes,
      faturacaoMesAnterior,
      variacaoFaturacao,
      totalPendente:    pendentes.totalPendente,
      numDocPendentes:  pendentes.numDoc,
      totalVencido:     pendentes.totalVencido,
      numDocVencidos:   pendentes.numVencidos,
      totalClientes,
      novosClientesMes,
      totalArtigos,
      artigosStockBaixo,
      topClientes,
      porTipo,
      faturacaoDiaria,
      evolucaoMensal,
    };
  }

  // ─────────────────────────────────────────────────────────────
  //  RELATÓRIO DE VENDAS (período personalizado)
  // ─────────────────────────────────────────────────────────────
  async getRelatorioVendas(
    tenantId: number,
    dataInicio: string,
    dataFim: string,
  ) {
    const faturas = await this.faturaRepo
      .createQueryBuilder('f')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.data BETWEEN :di AND :df', { di: dataInicio, df: dataFim })
      .andWhere('f.tipo IN (:...tipos)', { tipos: ['FT', 'FS'] })
      .andWhere('f.status != 4')
      .orderBy('f.data', 'DESC')
      .getMany();

    const totalFaturado = faturas.reduce((a, f) => a + Number(f.total), 0);
    const totalPago     = faturas.reduce((a, f) => a + Number(f.totalPago), 0);
    const totalPendente = faturas.reduce((a, f) => a + Number(f.saldo), 0);
    const numFaturas    = faturas.length;

    // Agrupar por cliente
    const porCliente: Record<string, { nome: string; nif: string; total: number; count: number }> = {};
    for (const f of faturas) {
      const key = String(f.clienteId);
      if (!porCliente[key]) {
        porCliente[key] = { nome: f.clienteNome, nif: f.clienteNif ?? '', total: 0, count: 0 };
      }
      porCliente[key].total += Number(f.total);
      porCliente[key].count += 1;
    }

    return {
      periodo: { dataInicio, dataFim },
      resumo: {
        totalFaturado: Number(totalFaturado.toFixed(2)),
        totalPago:     Number(totalPago.toFixed(2)),
        totalPendente: Number(totalPendente.toFixed(2)),
        numFaturas,
        ticketMedio:   numFaturas > 0 ? Number((totalFaturado / numFaturas).toFixed(2)) : 0,
      },
      porCliente: Object.entries(porCliente)
        .map(([id, v]) => ({ clienteId: Number(id), ...v, total: Number(v.total.toFixed(2)) }))
        .sort((a, b) => b.total - a.total),
      faturas,
    };
  }

  // ─────────────────────────────────────────────────────────────
  //  HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────
  private async getFaturacaoMes(tenantId: number, ano: number, mes: number): Promise<number> {
    const { total } = await this.faturaRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.total), 0)', 'total')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('YEAR(f.data) = :ano', { ano })
      .andWhere('MONTH(f.data) = :mes', { mes })
      .andWhere('f.tipo IN (:...tipos)', { tipos: ['FT', 'FS'] })
      .andWhere('f.status != 4')
      .getRawOne();
    return Number(Number(total).toFixed(2));
  }

  private async getPendentesResumo(tenantId: number) {
    const hoje = new Date().toISOString().split('T')[0];
    const rows: any[] = await this.faturaRepo
      .createQueryBuilder('f')
      .select([
        'COALESCE(SUM(f.saldo), 0)                                             AS totalPendente',
        'COUNT(f.id)                                                            AS numDoc',
        'COALESCE(SUM(CASE WHEN f.dataVencimento < :hoje THEN f.saldo ELSE 0 END), 0) AS totalVencido',
        'SUM(CASE WHEN f.dataVencimento < :hoje THEN 1 ELSE 0 END)             AS numVencidos',
      ])
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.status IN (:...s)', { s: [1, 3, 5] })
      .setParameter('hoje', hoje)
      .getRawMany();

    const r = rows[0] ?? {};
    return {
      totalPendente: Number(Number(r.totalPendente ?? 0).toFixed(2)),
      numDoc:        Number(r.numDoc ?? 0),
      totalVencido:  Number(Number(r.totalVencido ?? 0).toFixed(2)),
      numVencidos:   Number(r.numVencidos ?? 0),
    };
  }

  private async getNovosClientesMes(tenantId: number, ano: number, mes: number): Promise<number> {
    return this.clienteRepo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('YEAR(c.createdAt) = :ano', { ano })
      .andWhere('MONTH(c.createdAt) = :mes', { mes })
      .getCount();
  }

  private async getArtigosStockBaixo(tenantId: number): Promise<number> {
    return this.artigoRepo
      .createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId })
      .andWhere('a.controlaStock = true')
      .andWhere('a.stockAtual <= a.stockMinimo')
      .getCount();
  }

  private async getTopClientes(
    tenantId: number, ano: number, mes: number, n: number,
  ): Promise<{ clienteId: number; nome: string; total: number }[]> {
    const rows: any[] = await this.faturaRepo
      .createQueryBuilder('f')
      .select([
        'f.clienteId   AS clienteId',
        'f.clienteNome AS nome',
        'SUM(f.total)  AS total',
      ])
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('YEAR(f.data) = :ano', { ano })
      .andWhere('MONTH(f.data) = :mes', { mes })
      .andWhere('f.tipo IN (:...tipos)', { tipos: ['FT', 'FS'] })
      .andWhere('f.status != 4')
      .groupBy('f.clienteId, f.clienteNome')
      .orderBy('total', 'DESC')
      .limit(n)
      .getRawMany();

    return rows.map((r) => ({
      clienteId: Number(r.clienteId),
      nome:      r.nome ?? 'Consumidor Final',
      total:     Number(Number(r.total).toFixed(2)),
    }));
  }

  private async getFaturacaoPorTipo(
    tenantId: number, ano: number, mes: number,
  ): Promise<{ tipo: string; total: number; count: number }[]> {
    const rows: any[] = await this.faturaRepo
      .createQueryBuilder('f')
      .select(['f.tipo AS tipo', 'SUM(f.total) AS total', 'COUNT(f.id) AS count'])
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('YEAR(f.data) = :ano', { ano })
      .andWhere('MONTH(f.data) = :mes', { mes })
      .andWhere('f.status != 4')
      .groupBy('f.tipo')
      .getRawMany();

    return rows.map((r) => ({
      tipo:  r.tipo,
      total: Number(Number(r.total).toFixed(2)),
      count: Number(r.count),
    }));
  }

  private async getFaturacaoDiaria(
    tenantId: number, dias: number,
  ): Promise<{ data: string; total: number; count: number }[]> {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);
    const di = dataInicio.toISOString().split('T')[0];

    const rows: any[] = await this.faturaRepo
      .createQueryBuilder('f')
      .select([
        'DATE(f.data)  AS data',
        'SUM(f.total)  AS total',
        'COUNT(f.id)   AS count',
      ])
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.data >= :di', { di })
      .andWhere('f.tipo IN (:...tipos)', { tipos: ['FT', 'FS'] })
      .andWhere('f.status != 4')
      .groupBy('DATE(f.data)')
      .orderBy('DATE(f.data)', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      data:  r.data,
      total: Number(Number(r.total).toFixed(2)),
      count: Number(r.count),
    }));
  }

  private async getEvolucaoMensal(
    tenantId: number, meses: number,
  ): Promise<{ mes: string; total: number; pago: number }[]> {
    const dataInicio = new Date();
    dataInicio.setMonth(dataInicio.getMonth() - meses + 1);
    dataInicio.setDate(1);
    const di = dataInicio.toISOString().split('T')[0];

    const rows: any[] = await this.faturaRepo
      .createQueryBuilder('f')
      .select([
        'DATE_FORMAT(f.data, "%Y-%m") AS mes',
        'SUM(f.total)                 AS total',
        'SUM(f.totalPago)             AS pago',
      ])
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.data >= :di', { di })
      .andWhere('f.tipo IN (:...tipos)', { tipos: ['FT', 'FS'] })
      .andWhere('f.status != 4')
      .groupBy('DATE_FORMAT(f.data, "%Y-%m")')
      .orderBy('mes', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      mes:   r.mes,
      total: Number(Number(r.total).toFixed(2)),
      pago:  Number(Number(r.pago).toFixed(2)),
    }));
  }
}
