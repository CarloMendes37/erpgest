import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Cliente } from './cliente.entity';

@Injectable()
export class ClientesService {
  constructor(@InjectRepository(Cliente) private repo: Repository<Cliente>) {}

  async findAll(tenantId: number, query?: any) {
    const where: any = { tenantId };
    if (query?.search) {
      return this.repo.find({
        where: [
          { tenantId, nome: ILike(`%${query.search}%`) },
          { tenantId, nif: ILike(`%${query.search}%`) },
          { tenantId, email: ILike(`%${query.search}%`) },
        ],
        order: { nome: 'ASC' },
        take: query?.limit || 50,
      });
    }
    if (query?.status !== undefined) where.status = +query.status;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { nome: 'ASC' },
      skip: ((query?.page || 1) - 1) * (query?.limit || 20),
      take: query?.limit || 20,
    });
    return { data, total, page: query?.page || 1, totalPages: Math.ceil(total / (query?.limit || 20)) };
  }

  async findById(id: number, tenantId: number) {
    const c = await this.repo.findOne({ where: { id, tenantId } });
    if (!c) throw new NotFoundException(`Cliente ${id} não encontrado`);
    return c;
  }

  async create(data: Partial<Cliente>, tenantId: number) {
    const c = this.repo.create({ ...data, tenantId });
    return this.repo.save(c);
  }

  async update(id: number, data: Partial<Cliente>, tenantId: number) {
    await this.findById(id, tenantId);
    await this.repo.update({ id, tenantId }, data);
    return this.findById(id, tenantId);
  }

  async remove(id: number, tenantId: number) {
    await this.findById(id, tenantId);
    await this.repo.update({ id, tenantId }, { status: 1 }); // soft delete
    return { message: 'Cliente desativado' };
  }

  async getStats(tenantId: number) {
    const total = await this.repo.count({ where: { tenantId } });
    const ativos = await this.repo.count({ where: { tenantId, status: 0 } });
    const inativos = await this.repo.count({ where: { tenantId, status: 1 } });
    const bloqueados = await this.repo.count({ where: { tenantId, status: 2 } });
    return { total, ativos, inativos, bloqueados };
  }
}
