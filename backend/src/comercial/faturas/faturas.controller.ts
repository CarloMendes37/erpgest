import {
  Controller, Get, Post, Put, Patch, Body,
  Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FaturasService } from './faturas.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Comercial — Faturas')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'comercial/faturas', version: '1' })
export class FaturasController {
  constructor(private svc: FaturasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar faturas com filtros e paginação' })
  findAll(@Tenant() tid: number, @Query() query: any) {
    return this.svc.findAll(tid, query);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs de faturação' })
  kpis(@Tenant() tid: number) { return this.svc.getKpis(tid); }

  @Get('pendentes')
  @ApiOperation({ summary: 'Documentos com saldo em aberto' })
  pendentes(@Tenant() tid: number, @Query('clienteId') cid?: number) {
    return this.svc.findPendentes(tid, cid);
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Estatísticas por período' })
  estatisticas(
    @Tenant() tid: number,
    @Query('dataIni') di?: string,
    @Query('dataFim') df?: string,
  ) {
    return this.svc.getEstatisticas(tid, di, df);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Tenant() tid: number) {
    return this.svc.findById(id, tid);
  }

  @Post()
  @ApiOperation({ summary: 'Emitir nova fatura / documento' })
  create(@Body() body: any, @Tenant() tid: number) {
    return this.svc.create(body, tid);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Tenant() tid: number) {
    return this.svc.update(id, body, tid);
  }

  @Patch(':id/anular')
  @ApiOperation({ summary: 'Anular documento' })
  anular(@Param('id', ParseIntPipe) id: number, @Tenant() tid: number) {
    return this.svc.anular(id, tid);
  }

  @Patch(':id/liquidar')
  @ApiOperation({ summary: 'Registar pagamento parcial ou total' })
  liquidar(
    @Param('id', ParseIntPipe) id: number,
    @Body('valor') valor: number,
    @Tenant() tid: number,
  ) {
    return this.svc.liquidar(id, valor, tid);
  }
}
