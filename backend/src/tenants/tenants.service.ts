import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantsService {
  constructor(@InjectRepository(Tenant) private repo: Repository<Tenant>) {}

  findAll() { return this.repo.find({ order: { name: 'ASC' } }); }

  async findById(id: number) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException(`Tenant ${id} não encontrado`);
    return t;
  }

  async findBySlug(slug: string) {
    const t = await this.repo.findOne({ where: { slug } });
    if (!t) throw new NotFoundException(`Tenant '${slug}' não encontrado`);
    return t;
  }

  async create(data: Partial<Tenant>) {
    const exists = await this.repo.findOne({ where: { slug: data.slug } });
    if (exists) throw new ConflictException(`Slug '${data.slug}' já está em uso`);
    const tenant = this.repo.create(data);
    return this.repo.save(tenant);
  }

  async update(id: number, data: Partial<Tenant>) {
    await this.findById(id);
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async toggleActive(id: number) {
    const t = await this.findById(id);
    await this.repo.update(id, { active: !t.active });
    return this.findById(id);
  }
}
