import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Fatura }  from '../comercial/faturas/fatura.entity';
import { Cliente } from '../comercial/clientes/cliente.entity';
import { Artigo }  from '../comercial/artigos/artigo.entity';
import { User }    from '../users/user.entity';

export interface DashboardKpis {
  // Financeiro
  faturacaoMes:    number;
  recebimentosMes: number;
  saldoPendente:   number;
  saldoVencido:    number;

  // Clientes
  totalClientes:   number;
  clientesAtivos:  number;

  // Artigos / Inventário
  totalArtigos:    number;
  alertasStock:    number;

  // Documentos (mês atual)
  docEmitidos:     number;
  docAnulados:     number;
  docVencidos:     number;

  // Gráfico: evolução faturação (12 meses)
  evolucaoFaturacao: { mes: string; total: number }[];

  // Alertas / Notificações
  alertas: DashboardAlerta[];
}

export interface DashboardAlerta {
  tipo:       'vencimento' | 'stock' | 'licenca' | 'info';
  nivel:      'danger' | 'warning' | 'info';
  titulo:     string;
  descricao:  string;
  valor?:     number;
  link?:      string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Fatura)
    private readonly faturaRepo: Repository<Fatura>,
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(Artigo)
    private readonly artigoRepo: Repository<Artigo>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async getKpis(tenantId: number): Promise<DashboardKpis> {
    const hoje     = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;
    const hojeStr  = hoje.toISOString().split('T')[0];

    const [
      faturacaoMes,
      recebimentosMes,
      pendentes,
      totalClientes,
      clientesAtivos,
      totalArtigos,
      alertasStock,
      docsInfo,
      evolucao,
      alertas,
    ] = await Promise.all([
      this.getFaturacaoMes(tenantId, anoAtual, mesAtual),
      this.getRecebimentosMes(tenantId, anoAtual, mesAtual),
      this.getSaldoPendente(tenantId, hojeStr),
      this.clienteRepo.count({ where: { tenantId } }),
      this.clienteRepo.count({ where: { tenantId } }),
      this.artigoRepo.count({ where: { tenantId } }),
      this.getArtigosAlerta(tenantId),
      this.getDocsInfo(tenantId, anoAtual, mesAtual),
      this.getEvolucaoFaturacao(tenantId, 12),
      this.buildAlertas(tenantId, hojeStr),
    ]);

    return {
      faturacaoMes,
      recebimentosMes,
      saldoPendente:   pendentes.saldoPendente,
      saldoVencido:    pendentes.saldoVencido,
      totalClientes,
      clientesAtivos,
      totalArtigos,
      alertasStock,
      docEmitidos:     docsInfo.emitidos,
      docAnulados:     docsInfo.anulados,
      docVencidos:     docsInfo.vencidos,
      evolucaoFaturacao: evolucao,
      alertas,
    };
  }

  // ─── Helpers ────────────────────────────────────────────────
  private async getFaturacaoMes(tenantId: number, ano: number, mes: number) {
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

  private async getRecebimentosMes(tenantId: number, ano: number, mes: number) {
    const { total } = await this.faturaRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.totalPago), 0)', 'total')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('YEAR(f.data) = :ano', { ano })
      .andWhere('MONTH(f.data) = :mes', { mes })
      .andWhere('f.status != 4')
      .getRawOne();
    return Number(Number(total).toFixed(2));
  }

  private async getSaldoPendente(tenantId: number, hojeStr: string) {
    const rows: any[] = await this.faturaRepo
      .createQueryBuilder('f')
      .select([
        'COALESCE(SUM(f.saldo), 0) AS saldoPendente',
        `COALESCE(SUM(CASE WHEN f.dataVencimento < '${hojeStr}' THEN f.saldo ELSE 0 END), 0) AS saldoVencido`,
      ])
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.status IN (:...s)', { s: [1, 3, 5] })
      .getRawMany();

    const r = rows[0] ?? {};
    return {
      saldoPendente: Number(Number(r.saldoPendente ?? 0).toFixed(2)),
      saldoVencido:  Number(Number(r.saldoVencido ?? 0).toFixed(2)),
    };
  }

  private async getArtigosAlerta(tenantId: number): Promise<number> {
    return this.artigoRepo
      .createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId })
      .andWhere('a.controlaStock = true')
      .andWhere('a.ativo = true')
      .andWhere('a.stockAtual <= a.stockMinimo')
      .getCount();
  }

  private async getDocsInfo(tenantId: number, ano: number, mes: number) {
    const rows: any[] = await this.faturaRepo
      .createQueryBuilder('f')
      .select([
        'COUNT(f.id)                                   AS total',
        'SUM(CASE WHEN f.status = 4  THEN 1 ELSE 0 END) AS anulados',
        'SUM(CASE WHEN f.status = 5  THEN 1 ELSE 0 END) AS vencidos',
        'SUM(CASE WHEN f.status != 4 THEN 1 ELSE 0 END) AS emitidos',
      ])
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('YEAR(f.data) = :ano', { ano })
      .andWhere('MONTH(f.data) = :mes', { mes })
      .getRawMany();

    const r = rows[0] ?? {};
    return {
      emitidos: Number(r.emitidos ?? 0),
      anulados: Number(r.anulados ?? 0),
      vencidos: Number(r.vencidos ?? 0),
    };
  }

  private async getEvolucaoFaturacao(tenantId: number, meses: number) {
    const di = new Date();
    di.setMonth(di.getMonth() - meses + 1);
    di.setDate(1);
    const diStr = di.toISOString().split('T')[0];

    const rows: any[] = await this.faturaRepo
      .createQueryBuilder('f')
      .select(['DATE_FORMAT(f.data, "%Y-%m") AS mes', 'SUM(f.total) AS total'])
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.data >= :di', { di: diStr })
      .andWhere('f.tipo IN (:...tipos)', { tipos: ['FT', 'FS'] })
      .andWhere('f.status != 4')
      .groupBy('DATE_FORMAT(f.data, "%Y-%m")')
      .orderBy('mes', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      mes:   r.mes,
      total: Number(Number(r.total).toFixed(2)),
    }));
  }

  private async buildAlertas(tenantId: number, hojeStr: string): Promise<DashboardAlerta[]> {
    const alertas: DashboardAlerta[] = [];

    // Documentos vencidos
    const numVencidos = await this.faturaRepo
      .createQueryBuilder('f')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.status = 5')
      .getCount();

    if (numVencidos > 0) {
      alertas.push({
        tipo:      'vencimento',
        nivel:     'danger',
        titulo:    'Documentos Vencidos',
        descricao: `Tem ${numVencidos} documento(s) com prazo de pagamento ultrapassado.`,
        valor:     numVencidos,
        link:      '/faturas?status=5',
      });
    }

    // Artigos com stock baixo
    const stockBaixo = await this.getArtigosAlerta(tenantId);
    if (stockBaixo > 0) {
      alertas.push({
        tipo:      'stock',
        nivel:     'warning',
        titulo:    'Stock Baixo',
        descricao: `${stockBaixo} artigo(s) abaixo do stock mínimo.`,
        valor:     stockBaixo,
        link:      '/artigos?alerta=stock',
      });
    }

    // Documentos a vencer em 7 dias
    const em7dias = new Date(hojeStr);
    em7dias.setDate(em7dias.getDate() + 7);
    const em7diasStr = em7dias.toISOString().split('T')[0];

    const aVencer = await this.faturaRepo
      .createQueryBuilder('f')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.status IN (:...s)', { s: [1, 3] })
      .andWhere('f.dataVencimento BETWEEN :hoje AND :fim', { hoje: hojeStr, fim: em7diasStr })
      .getCount();

    if (aVencer > 0) {
      alertas.push({
        tipo:      'vencimento',
        nivel:     'warning',
        titulo:    'A Vencer em Breve',
        descricao: `${aVencer} documento(s) vencem nos próximos 7 dias.`,
        valor:     aVencer,
        link:      '/faturas?pendentes=true',
      });
    }

    return alertas;
  }
}
