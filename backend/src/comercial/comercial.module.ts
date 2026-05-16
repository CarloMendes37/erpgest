import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Fatura }     from './faturas/fatura.entity';
import { FaturaLinha } from './faturas/fatura-linha.entity';
import { Cliente }    from './clientes/cliente.entity';
import { Artigo }     from './artigos/artigo.entity';

import { FaturasController }           from './faturas/faturas.controller';
import { ClientesController }          from './clientes/clientes.controller';
import { ArtigosController }           from './artigos/artigos.controller';
import { ContaCorrenteController }     from './conta-corrente/conta-corrente.controller';
import { DashboardComercialController } from './dashboard/dashboard-comercial.controller';

import { FaturasService }           from './faturas/faturas.service';
import { ClientesService }          from './clientes/clientes.service';
import { ArtigosService }           from './artigos/artigos.service';
import { ContaCorrenteService }     from './conta-corrente/conta-corrente.service';
import { DashboardComercialService } from './dashboard/dashboard-comercial.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fatura, FaturaLinha, Cliente, Artigo]),
  ],
  controllers: [
    FaturasController,
    ClientesController,
    ArtigosController,
    ContaCorrenteController,
    DashboardComercialController,
  ],
  providers: [
    FaturasService,
    ClientesService,
    ArtigosService,
    ContaCorrenteService,
    DashboardComercialService,
  ],
  exports: [FaturasService, ClientesService, ArtigosService, ContaCorrenteService],
})
export class ComercialModule {}
