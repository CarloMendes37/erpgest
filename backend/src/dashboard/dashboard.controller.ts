import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard }  from '../common/guards/jwt-auth.guard';
import { TenantGuard }   from '../common/guards/tenant.guard';
import { Tenant }        from '../common/decorators/tenant.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs principais do ERP (resumo geral do tenant)' })
  async getKpis(@Tenant() tenantId: number) {
    return this.dashService.getKpis(tenantId);
  }
}
