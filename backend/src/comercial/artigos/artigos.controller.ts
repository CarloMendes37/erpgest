import { Controller, Get, Post, Put, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ArtigosService } from './artigos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Comercial — Artigos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'comercial/artigos', version: '1' })
export class ArtigosController {
  constructor(private svc: ArtigosService) {}

  @Get()
  findAll(@Tenant() tid: number, @Query() query: any) { return this.svc.findAll(tid, query); }

  @Get('alertas-stock')
  alertasStock(@Tenant() tid: number) { return this.svc.getAlertasStock(tid); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Tenant() tid: number) {
    return this.svc.findById(id, tid);
  }

  @Post()
  create(@Body() body: any, @Tenant() tid: number) { return this.svc.create(body, tid); }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Tenant() tid: number) {
    return this.svc.update(id, body, tid);
  }
}
