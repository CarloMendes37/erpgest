import { Controller, Get, Post, Put, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Tenants')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(private svc: TenantsService) {}

  @Get()
  @Roles('ROLE_ADMIN')
  @ApiOperation({ summary: 'Listar todos os tenants (ADMIN)' })
  findAll() { return this.svc.findAll(); }

  @Get(':id')
  @Roles('ROLE_ADMIN')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findById(id); }

  @Post()
  @Roles('ROLE_ADMIN')
  create(@Body() body: any) { return this.svc.create(body); }

  @Put(':id')
  @Roles('ROLE_ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Patch(':id/toggle')
  @Roles('ROLE_ADMIN')
  toggle(@Param('id', ParseIntPipe) id: number) { return this.svc.toggleActive(id); }
}
