import {
  Injectable, CanActivate, ExecutionContext,
  UnauthorizedException, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/roles.decorator';

/**
 * TenantGuard — garante que o utilizador autenticado pertence ao tenant
 * especificado no header X-Tenant-Slug ou no JWT.
 *
 * Injeta req.tenantId para uso nos controllers/services.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new UnauthorizedException('Não autenticado');

    // O tenantId vem do JWT payload (definido no AuthModule)
    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant não definido no token');
    }

    // Injeta no request para uso nos controllers
    request.tenantId = tenantId;
    return true;
  }
}
