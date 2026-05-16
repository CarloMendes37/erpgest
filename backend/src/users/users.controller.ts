import {
  Controller, Get, Post, Put, Patch, Body,
  Param, ParseIntPipe, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';

@ApiTags('Utilizadores')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private svc: UsersService) {}

  @Get()
  @Roles('ROLE_ADMIN', 'ROLE_MANAGER')
  @ApiOperation({ summary: 'Listar utilizadores do tenant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Tenant() tenantId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.findAll(tenantId, +page, +limit);
  }

  @Get(':id')
  @Roles('ROLE_ADMIN', 'ROLE_MANAGER')
  findOne(@Param('id', ParseIntPipe) id: number, @Tenant() tenantId: number) {
    return this.svc.findById(id, tenantId);
  }

  @Post()
  @Roles('ROLE_ADMIN')
  create(@Body() body: any, @Tenant() tenantId: number) {
    return this.svc.create(body, tenantId);
  }

  @Put(':id')
  @Roles('ROLE_ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @Tenant() tenantId: number,
  ) {
    return this.svc.update(id, body, tenantId);
  }

  @Patch(':id/toggle')
  @Roles('ROLE_ADMIN')
  toggle(@Param('id', ParseIntPipe) id: number, @Tenant() tenantId: number) {
    return this.svc.toggleActive(id, tenantId);
  }
}
