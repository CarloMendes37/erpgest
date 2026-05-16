import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LicenseService } from './license.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Tenant } from '../common/decorators/tenant.decorator';

@ApiTags('License')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller({ path: 'license', version: '1' })
export class LicenseController {
  constructor(private svc: LicenseService) {}

  @Get()
  @Roles('ROLE_ADMIN', 'ROLE_MANAGER')
  findAll(@Tenant() tid: number) { return this.svc.findByTenant(tid); }

  @Get('active')
  @Roles('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER')
  getActive(@Tenant() tid: number) { return this.svc.getActiveLicense(tid); }

  @Post()
  @Roles('ROLE_ADMIN')
  create(@Body() body: any, @Tenant() tid: number) { return this.svc.createLicense(tid, body); }

  @Patch(':id/revoke')
  @Roles('ROLE_ADMIN')
  revoke(@Param('id', ParseIntPipe) id: number, @Tenant() tid: number) {
    return this.svc.revoke(id, tid);
  }
}
