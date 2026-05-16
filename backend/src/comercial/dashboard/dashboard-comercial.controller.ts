import {
  Controller, Get, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard }            from '../../common/guards/jwt-auth.guard';
import { TenantGuard }             from '../../common/guards/tenant.guard';
import { Tenant }                  from '../../common/decorators/tenant.decorator';
import { DashboardComercialService } from './dashboard-comercial.service';

@ApiTags('Comercial — Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'comercial/dashboard', version: '1' })
export class DashboardComercialController {
  constructor(private readonly dashService: DashboardComercialService) {}

  // ── GET /api/v1/comercial/dashboard/kpis ────────────────────
  @Get('kpis')
  @ApiOperation({ summary: 'KPIs principais do dashboard comercial' })
  async getKpis(@Tenant() tenantId: number) {
    return this.dashService.getKpis(tenantId);
  }

  // ── GET /api/v1/comercial/dashboard/relatorio-vendas ────────
  @Get('relatorio-vendas')
  @ApiOperation({ summary: 'Relatório de vendas por período' })
  @ApiQuery({ name: 'dataInicio', required: true,  example: '2024-01-01' })
  @ApiQuery({ name: 'dataFim',    required: true,  example: '2024-12-31' })
  async getRelatorioVendas(
    @Tenant() tenantId: number,
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim')    dataFim: string,
  ) {
    const hoje  = new Date().toISOString().split('T')[0];
    const di    = dataInicio ?? `${new Date().getFullYear()}-01-01`;
    const df    = dataFim    ?? hoje;
    return this.dashService.getRelatorioVendas(tenantId, di, df);
  }
}
