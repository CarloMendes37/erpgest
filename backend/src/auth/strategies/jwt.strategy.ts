import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  tenantId: number;
  tenantSlug: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'erpgest-secret'),
      issuer: 'erpgest',
      audience: 'erpgest-client',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: payload.sub, active: true },
    });
    if (!user) {
      throw new UnauthorizedException('Utilizador não encontrado ou inativo');
    }
    // Garante que tenantId está no user para o TenantGuard
    user['tenantId'] = payload.tenantId;
    return user;
  }
}
