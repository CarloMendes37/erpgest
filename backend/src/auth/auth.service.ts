import {
  Injectable, UnauthorizedException, ConflictException,
  BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { Tenant } from '../tenants/tenant.entity';
import { RefreshToken } from './refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)     private userRepo:    Repository<User>,
    @InjectRepository(Role)     private roleRepo:    Repository<Role>,
    @InjectRepository(Tenant)   private tenantRepo:  Repository<Tenant>,
    @InjectRepository(RefreshToken) private rtRepo:  Repository<RefreshToken>,
    private jwtService:   JwtService,
    private configService: ConfigService,
  ) {}

  // ── Validate (Passport Local) ────────────────────────────
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return null;
    if (!user.active) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  // ── Register ─────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email já está em uso');

    // Buscar ou criar tenant padrão
    let tenant = await this.tenantRepo.findOne({ where: { slug: dto.tenantSlug || 'default' } });
    if (!tenant) {
      tenant = this.tenantRepo.create({
        slug: dto.tenantSlug || 'default',
        name: dto.tenantName || 'Default Tenant',
        schemaName: dto.tenantSlug || 'default',
        plan: 'FREE',
      });
      tenant = await this.tenantRepo.save(tenant);
    }

    const role = await this.roleRepo.findOne({ where: { name: 'ROLE_USER' } });
    if (!role) throw new BadRequestException('Role ROLE_USER não encontrada. Execute o seed.');

    const hash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash: hash,
      tenantId: tenant.id,
      active: true,
      emailVerified: false,
      roles: [role],
    });

    const saved = await this.userRepo.save(user);
    this.logger.log(`Novo utilizador registado: ${saved.email} (tenant: ${tenant.slug})`);
    return { message: 'Registo efetuado com sucesso', userId: saved.id };
  }

  // ── Login ─────────────────────────────────────────────────
  async login(user: User, ip?: string, userAgent?: string) {
    const tenant = await this.tenantRepo.findOne({ where: { id: user.tenantId } });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      tenantSlug: tenant?.slug || 'default',
      roles: user.getRoleNames(),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id, user.tenantId, ip, userAgent);

    // Atualizar lastLoginAt
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    this.logger.log(`Login: ${user.email} (tenant: ${tenant?.slug})`);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: 900,  // 15 minutos em segundos
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        tenantSlug: tenant?.slug,
        tenantName: tenant?.name,
        roles: user.getRoleNames(),
        permissions: user.getAllPermissions(),
        photoUrl: user.photoUrl,
      },
    };
  }

  // ── Refresh Token ─────────────────────────────────────────
  async refresh(token: string) {
    const rt = await this.rtRepo.findOne({
      where: { token, revoked: false },
    });

    if (!rt) throw new UnauthorizedException('Refresh token inválido');
    if (rt.expiresAt < new Date()) {
      await this.rtRepo.update(rt.id, { revoked: true, revokedAt: new Date() });
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = await this.userRepo.findOne({ where: { id: rt.userId, active: true } });
    if (!user) throw new UnauthorizedException('Utilizador não encontrado');

    // Revogar token usado (rotation)
    await this.rtRepo.update(rt.id, { revoked: true, revokedAt: new Date() });

    return this.login(user);
  }

  // ── Logout ────────────────────────────────────────────────
  async logout(userId: number, token?: string) {
    if (token) {
      await this.rtRepo.update({ token }, { revoked: true, revokedAt: new Date() });
    } else {
      await this.rtRepo.update({ userId, revoked: false }, { revoked: true, revokedAt: new Date() });
    }
    return { message: 'Sessão terminada com sucesso' };
  }

  // ── Me (perfil) ───────────────────────────────────────────
  async getMe(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado');
    const tenant = await this.tenantRepo.findOne({ where: { id: user.tenantId } });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      tenantId: user.tenantId,
      tenantSlug: tenant?.slug,
      tenantName: tenant?.name,
      roles: user.getRoleNames(),
      permissions: user.getAllPermissions(),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  // ── Helpers ───────────────────────────────────────────────
  private async createRefreshToken(
    userId: number, tenantId: number, ip?: string, userAgent?: string
  ): Promise<RefreshToken> {
    const token = uuidv4() + '-' + uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    const rt = this.rtRepo.create({ userId, tenantId, token, expiresAt, ipAddress: ip, userAgent });
    return this.rtRepo.save(rt);
  }
}
