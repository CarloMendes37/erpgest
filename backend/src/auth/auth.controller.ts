import {
  Controller, Post, Get, Body, Req,
  UseGuards, HttpCode, HttpStatus, Version,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, RefreshDto } from './dto/login.dto';
import { Public, CurrentUser } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registar novo utilizador' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login — retorna JWT + refresh token' })
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: Request) {
    const ip = req.ip;
    const ua = req.headers['user-agent'];
    return this.authService.login(req.user as any, ip, ua);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token via refresh token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminar sessão (revogar refresh token)' })
  async logout(@Req() req: Request, @Body() body: RefreshDto) {
    const user = req.user as any;
    return this.authService.logout(user.id, body?.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('me')
  @ApiOperation({ summary: 'Perfil do utilizador autenticado' })
  async me(@Req() req: Request) {
    const user = req.user as any;
    return this.authService.getMe(user.id);
  }
}
