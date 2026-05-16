import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @Tenant() — extrai o tenantId do request (injectado pelo TenantGuard).
 * Uso: @Tenant() tenantId: number
 */
export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);

/**
 * @CurrentUser() — extrai o utilizador autenticado do request.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
