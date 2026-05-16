import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Fatura }  from '../comercial/faturas/fatura.entity';
import { Cliente } from '../comercial/clientes/cliente.entity';
import { Artigo }  from '../comercial/artigos/artigo.entity';
import { User }    from '../users/user.entity';

import { DashboardService }    from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fatura, Cliente, Artigo, User]),
  ],
  controllers: [DashboardController],
  providers:   [DashboardService],
  exports:     [DashboardService],
})
export class DashboardModule {}
