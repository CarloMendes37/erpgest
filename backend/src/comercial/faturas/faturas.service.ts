import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike } from 'typeorm';
import { Fatura } from './fatura.entity';
import { FaturaLinha } from './fatura-linha.entity';

@Injectable()
export class FaturasService {
  constructor(
    @InjectRepository(Fatura)      private repo:      Repository<Fatura>,
    @InjectRepository(FaturaLinha) private linhaRepo: Repository<FaturaLinha>,
  ) {}

  async findAll(tenantId: number, query?: any) {
    const qb = this.repo.createQueryBuilder('f')
      .where('f.tenantId = :tid', { tid: tenantId })
      .orderBy('f.data', 'DESC')
      .addOrderBy('f.id', 'DESC');

    if (query?.tipo)    qb.andWhere('f.tipo = :tipo', { tipo: query.tipo });
    if (query?.status !== undefined) qb.andWhere('f.status = :s', { s: +query.status });
    if (query?.clienteId) qb.andWhere('f.clienteId = :cid', { cid: +query.clienteId });
    if (query?.search)  qb.andWhere('(f.numero LIKE :q OR f.clienteNome LIKE :q)', { q: `%${query.search}%` });
    if (query?.dataIni && query?.dataFim) {
      qb.andWhere('f.data BETWEEN :di AND :df', { di: query.dataIni, df: query.dataFim });
    }

    const page  = +(query?.page || 1);
    const limit = +(query?.limit || 20);
    const [data, total] = await qb.skip((page-1)*limit).take(limit).getManyAndCount();
    return { data, total, page, totalPages: Math.ceil(total/limit) };
  }

  async findById(id: number, tenantId: number) {
    const f = await this.repo.findOne({
      where: { id, tenantId },
      relations: ['linhas'],
    });
    if (!f) throw new NotFoundException(`Fatura ${id} não encontrada`);
    return f;
  }

  async findPendentes(tenantId: number, clienteId?: number) {
    const qb = this.repo.createQueryBuilder('f')
      .where('f.tenantId = :tid', { tid: tenantId })
      .andWhere('f.status IN (1, 3, 5)')
      .andWhere('f.saldo > 0')
      .orderBy('f.dataVencimento', 'ASC');
    if (clienteId) qb.andWhere('f.clienteId = :cid', { cid: clienteId });
    return qb.getMany();
  }

  async create(data: any, tenantId: number) {
    const linhas = data.linhas || [];
    delete data.linhas;

    // Calcular totais
    let subtotal = 0, totalIva = 0;
    const linhasProcessadas = linhas.map((l: any, i: number) => {
      const p1 = l.precoUnit * (1 - (l.desconto1 || 0) / 100);
      const p2 = p1 * (1 - (l.desconto2 || 0) / 100);
      const base = l.quantidade * p2;
      const iva  = base * ((l.taxaIva || 23) / 100);
      subtotal += base;
      totalIva += iva;
      return { ...l, tenantId, linhaNum: i + 1, baseTributavel: base, valorIva: iva, totalLinha: base + iva };
    });

    const fatura = this.repo.create({
      ...data,
      tenantId,
      subtotal,
      baseIva: subtotal,
      totalIva,
      total: subtotal + totalIva,
      saldo:  subtotal + totalIva,
      status: data.status || 1,
    });

    const saved = await this.repo.save(fatura) as unknown as Fatura;
    if (linhasProcessadas.length > 0) {
      const linhasEntidades = linhasProcessadas.map(l =>
        this.linhaRepo.create({ ...l, faturaId: saved.id })
      );
      await this.linhaRepo.save(linhasEntidades);
    }
    return this.findById(saved.id, tenantId);
  }

  async update(id: number, data: any, tenantId: number) {
    await this.findById(id, tenantId);
    const linhas = data.linhas;
    delete data.linhas;
    await this.repo.update({ id, tenantId }, data);
    if (linhas) {
      await this.linhaRepo.delete({ faturaId: id, tenantId });
      const novas = linhas.map((l: any, i: number) =>
        this.linhaRepo.create({ ...l, faturaId: id, tenantId, linhaNum: i + 1 })
      );
      await this.linhaRepo.save(novas);
    }
    return this.findById(id, tenantId);
  }

  async anular(id: number, tenantId: number) {
    const f = await this.findById(id, tenantId);
    if (f.status === 4) throw new BadRequestException('Fatura já anulada');
    await this.repo.update({ id, tenantId }, { status: 4 });
    return this.findById(id, tenantId);
  }

  async liquidar(id: number, valor: number, tenantId: number) {
    const f = await this.findById(id, tenantId);
    const novoTotalPago = +f.totalPago + valor;
    const novoSaldo = +f.total - novoTotalPago;
    const novoStatus = novoSaldo <= 0 ? 2 : 3;
    await this.repo.update({ id, tenantId }, {
      totalPago: novoTotalPago,
      saldo: Math.max(0, novoSaldo),
      status: novoStatus,
    });
    return this.findById(id, tenantId);
  }

  async getKpis(tenantId: number) {
    const hoje = new Date().toISOString().split('T')[0];
    const mesIni = hoje.substring(0, 8) + '01';

    const [totalMes, pendentes, vencidas, anuladas] = await Promise.all([
      this.repo.createQueryBuilder('f')
        .select('SUM(f.total)', 'total')
        .where('f.tenantId = :tid AND f.status != 4 AND f.data >= :di', { tid: tenantId, di: mesIni })
        .getRawOne(),
      this.repo.createQueryBuilder('f')
        .select('SUM(f.saldo)', 'saldo').addSelect('COUNT(*)', 'count')
        .where('f.tenantId = :tid AND f.status IN (1,3,5) AND f.saldo > 0', { tid: tenantId })
        .getRawOne(),
      this.repo.count({ where: { tenantId, status: 5 } }),
      this.repo.count({ where: { tenantId, status: 4 } }),
    ]);

    return {
      faturacaoMes: +(totalMes?.total || 0),
      pendenteValor: +(pendentes?.saldo || 0),
      pendenteCount: +(pendentes?.count || 0),
      vencidas,
      anuladas,
    };
  }

  async getEstatisticas(tenantId: number, dataIni?: string, dataFim?: string) {
    const di = dataIni || new Date().toISOString().substring(0, 8) + '01';
    const df = dataFim || new Date().toISOString().split('T')[0];

    const porDia = await this.repo
      .createQueryBuilder('f')
      .select('f.data', 'data')
      .addSelect('SUM(f.total)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('f.tenantId = :tid AND f.status != 4 AND f.data BETWEEN :di AND :df', { tid: tenantId, di, df })
      .groupBy('f.data')
      .orderBy('f.data', 'ASC')
      .getRawMany();

    const porTipo = await this.repo
      .createQueryBuilder('f')
      .select('f.tipo', 'tipo')
      .addSelect('SUM(f.total)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('f.tenantId = :tid AND f.status != 4 AND f.data BETWEEN :di AND :df', { tid: tenantId, di, df })
      .groupBy('f.tipo')
      .getRawMany();

    return { porDia, porTipo, periodo: { di, df } };
  }
}
