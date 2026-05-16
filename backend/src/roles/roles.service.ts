import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RolesService {
  constructor(@InjectRepository(Role) private repo: Repository<Role>) {}

  findAll() { return this.repo.find({ order: { name: 'ASC' } }); }

  async findById(id: number) {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException(`Role ${id} não encontrada`);
    return r;
  }

  async create(data: Partial<Role>) {
    const exists = await this.repo.findOne({ where: { name: data.name } });
    if (exists) throw new ConflictException(`Role '${data.name}' já existe`);
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Role>) {
    await this.findById(id);
    await this.repo.update(id, data);
    return this.findById(id);
  }
}
