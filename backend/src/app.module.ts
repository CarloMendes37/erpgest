import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { TenantsModule } from './tenants/tenants.module';
import { LicenseModule } from './license/license.module';
import { ComercialModule } from './comercial/comercial.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // ── Rate Limiting ────────────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1000,  limit: 20 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long',   ttl: 60000, limit: 500 },
    ]),

    // ── TypeORM / MariaDB ────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host:     cfg.get('DB_HOST', 'localhost'),
        port:     cfg.get<number>('DB_PORT', 3306),
        username: cfg.get('DB_USER', 'root'),
        password: cfg.get('DB_PASS', ''),
        database: cfg.get('DB_NAME', 'erpgest'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: cfg.get('DB_SYNC', 'false') === 'true',
        logging: cfg.get('DB_LOGGING', 'false') === 'true',
        charset: 'utf8mb4',
        timezone: '+00:00',
        extra: {
          connectionLimit: 20,
          waitForConnections: true,
          queueLimit: 0,
        },
      }),
      inject: [ConfigService],
    }),

    // ── Feature Modules ──────────────────────────────────────
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    TenantsModule,
    LicenseModule,
    ComercialModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
