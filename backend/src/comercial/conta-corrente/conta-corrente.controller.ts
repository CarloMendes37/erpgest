import {
  Controller, Get, Param, Query,
  ParseIntPipe, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiParam, ApiQuery, ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard }       from '../../common/guards/jwt-auth.guard';
import { TenantGuard }        from '../../common/guards/tenant.guard';
import { Tenant }             from '../../common/decorators/tenant.decorator';
import { ContaCorrenteService } from './conta-corrente.service';

@ApiTags('Comercial — Conta Corrente')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'comercial/conta-corrente', version: '1' })
export class ContaCorrenteController {
  constructor(private readonly ccService: ContaCorrenteService) {}

  // ── GET /api/v1/comercial/conta-corrente/resumo ──────────────
  @Get('resumo')
  @ApiOperation({ summary: 'Resumo global de conta corrente do tenant' })
  async getResumoGlobal(@Tenant() tenantId: number) {
    return this.ccService.getResumoGlobal(tenantId);
  }

  // ── GET /api/v1/comercial/conta-corrente/saldos ─────────────
  @Get('saldos')
  @ApiOperation({ summary: 'Saldos de todos os clientes (paginado)' })
  @ApiQuery({ name: 'apenasComSaldo', required: false, type: Boolean })
  @ApiQuery({ name: 'page',          required: false, type: Number })
  @ApiQuery({ name: 'limit',         required: false, type: Number })
  @ApiQuery({ name: 'search',        required: false, type: String })
  async getSaldos(
    @Tenant() tenantId: number,
    @Query('apenasComSaldo') apenasComSaldo?: string,
    @Query('page')           page?: string,
    @Query('limit')          limit?: string,
    @Query('search')         search?: string,
  ) {
    return this.ccService.getSaldos(tenantId, {
      apenasComSaldo: apenasComSaldo === 'true',
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 50,
      search,
    });
  }

  // ── GET /api/v1/comercial/conta-corrente/devedores ──────────
  @Get('devedores')
  @ApiOperation({ summary: 'Mapa de devedores (aging) — clientes com saldo vencido' })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  async getDevedores(
    @Tenant() tenantId: number,
    @Query('limite') limite?: string,
  ) {
    return this.ccService.getDevedores(tenantId, limite ? Number(limite) : 50);
  }

  // ── GET /api/v1/comercial/conta-corrente/clientes/:id/extrato
  @Get('clientes/:id/extrato')
  @ApiOperation({ summary: 'Extrato de conta corrente de um cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  @ApiQuery({ name: 'dataInicio', required: false, example: '2024-01-01' })
  @ApiQuery({ name: 'dataFim',    required: false, example: '2024-12-31' })
  async getExtrato(
    @Tenant() tenantId: number,
    @Param('id', ParseIntPipe) clienteId: number,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim')    dataFim?: string,
  ) {
    return this.ccService.getExtrato(tenantId, clienteId, dataInicio, dataFim);
  }

  // ── GET /api/v1/comercial/conta-corrente/clientes/:id/pendentes
  @Get('clientes/:id/pendentes')
  @ApiOperation({ summary: 'Documentos pendentes de pagamento de um cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  async getPendentesCliente(
    @Tenant() tenantId: number,
    @Param('id', ParseIntPipe) clienteId: number,
  ) {
    return this.ccService.getPendentesCliente(tenantId, clienteId);
  }
}
