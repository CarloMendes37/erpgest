import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  // CRÍTICO: sempre filtrar por tenantId
  async findAll(tenantId: number, page = 1, limit = 20) {
    const [users, total] = await this.userRepo.findAndCount({
      where: { tenantId },
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: users.map(u => this.sanitize(u)),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number, tenantId: number) {
    const u = await this.userRepo.findOne({ where: { id, tenantId } });
    if (!u) throw new NotFoundException(`Utilizador ${id} não encontrado`);
    return this.sanitize(u);
  }

  async create(data: any, tenantId: number) {
    const exists = await this.userRepo.findOne({ where: { email: data.email } });
    if (exists) throw new ConflictException('Email já está em uso');

    const roles = data.roleIds
      ? await this.roleRepo.find({ where: { id: In(data.roleIds) } })
      : [await this.roleRepo.findOne({ where: { name: 'ROLE_USER' } })];

    const hash = await bcrypt.hash(data.password || 'Erpgest@2025', 12);
    const user = this.userRepo.create({
      ...data,
      tenantId,
      passwordHash: hash,
      roles: roles.filter(Boolean),
    });
    const saved = await this.userRepo.save(user) as unknown as User;
    return this.sanitize(saved);
  }

  async update(id: number, data: any, tenantId: number) {
    const user = await this.userRepo.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');

    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 12);
      delete data.password;
    }
    if (data.roleIds) {
      user.roles = await this.roleRepo.find({ where: { id: In(data.roleIds) } });
      delete data.roleIds;
    }

    Object.assign(user, data);
    const saved = await this.userRepo.save(user);
    return this.sanitize(saved);
  }

  async toggleActive(id: number, tenantId: number) {
    const user = await this.userRepo.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    user.active = !user.active;
    return this.sanitize(await this.userRepo.save(user));
  }

  /** Actualiza nome e foto do próprio utilizador */
  async updateProfile(userId: number, tenantId: number, data: { name?: string; photoUrl?: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    if (data.name)     user.name     = data.name;
    if (data.photoUrl !== undefined) user.photoUrl = data.photoUrl;
    return this.sanitize(await this.userRepo.save(user));
  }

  /** Alterar password do próprio utilizador */
  async changePassword(
    userId: number,
    tenantId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new ForbiddenException('Password actual incorrecta');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.save(user);
    return { message: 'Password alterada com sucesso' };
  }

  private sanitize(u: User) {
    const { passwordHash, ...rest } = u as any;
    return rest;
  }
}
