import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Não autenticado');

    const userRoles = user.getRoleNames ? user.getRoleNames() : [];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Requer role: ${requiredRoles.join(' ou ')}`,
      );
    }
    return true;
  }
}
