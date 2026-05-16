import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Tenant } from '../../common/decorators/tenant.decorator';

@ApiTags('Comercial — Clientes')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'comercial/clientes', version: '1' })
export class ClientesController {
  constructor(private svc: ClientesService) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Tenant() tid: number, @Query() query: any) {
    return this.svc.findAll(tid, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'KPIs de clientes' })
  stats(@Tenant() tid: number) { return this.svc.getStats(tid); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Tenant() tid: number) {
    return this.svc.findById(id, tid);
  }

  @Post()
  create(@Body() body: any, @Tenant() tid: number) {
    return this.svc.create(body, tid);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Tenant() tid: number) {
    return this.svc.update(id, body, tid);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Tenant() tid: number) {
    return this.svc.remove(id, tid);
  }
}
