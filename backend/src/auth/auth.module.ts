import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshToken } from './refresh-token.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Tenant, RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('JWT_SECRET', 'erpgest-secret'),
        signOptions: {
          expiresIn: cfg.get('JWT_EXPIRES_IN', '15m'),
          issuer: 'erpgest',
          audience: 'erpgest-client',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
