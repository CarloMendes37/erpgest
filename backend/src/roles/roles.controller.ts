import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Roles')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ROLE_ADMIN')
@Controller({ path: 'roles', version: '1' })
export class RolesController {
  constructor(private svc: RolesService) {}

  @Get()   findAll()                               { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findById(id); }
  @Post()  create(@Body() body: any)               { return this.svc.create(body); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }
}
