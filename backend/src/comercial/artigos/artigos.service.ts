import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Artigo } from './artigo.entity';

@Injectable()
export class ArtigosService {
  constructor(@InjectRepository(Artigo) private repo: Repository<Artigo>) {}

  async findAll(tenantId: number, query?: any) {
    if (query?.search) {
      return this.repo.find({
        where: [
          { tenantId, descricao: ILike(`%${query.search}%`) },
          { tenantId, codigo: ILike(`%${query.search}%`) },
        ],
        order: { descricao: 'ASC' },
        take: query?.limit || 50,
      });
    }
    const where: any = { tenantId };
    if (query?.ativo !== undefined) where.ativo = query.ativo === 'true';
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { descricao: 'ASC' },
      skip: ((query?.page || 1) - 1) * (query?.limit || 20),
      take: query?.limit || 20,
    });
    return { data, total, page: query?.page || 1 };
  }

  async findById(id: number, tenantId: number) {
    const a = await this.repo.findOne({ where: { id, tenantId } });
    if (!a) throw new NotFoundException(`Artigo ${id} não encontrado`);
    return a;
  }

  async findByCodigo(codigo: string, tenantId: number) {
    return this.repo.findOne({ where: { codigo, tenantId } });
  }

  async create(data: Partial<Artigo>, tenantId: number) {
    return this.repo.save(this.repo.create({ ...data, tenantId }));
  }

  async update(id: number, data: Partial<Artigo>, tenantId: number) {
    await this.findById(id, tenantId);
    await this.repo.update({ id, tenantId }, data);
    return this.findById(id, tenantId);
  }

  async updateStock(id: number, delta: number, tenantId: number) {
    const a = await this.findById(id, tenantId);
    await this.repo.update({ id, tenantId }, { stockAtual: a.stockAtual + delta });
    return this.findById(id, tenantId);
  }

  async getAlertasStock(tenantId: number) {
    return this.repo
      .createQueryBuilder('a')
      .where('a.tenantId = :tid', { tid: tenantId })
      .andWhere('a.ativo = true')
      .andWhere('a.stockAtual <= a.stockMinimo')
      .orderBy('a.stockAtual', 'ASC')
      .getMany();
  }
}
