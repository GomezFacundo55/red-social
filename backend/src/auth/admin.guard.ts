import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.usuario?.perfil !== 'administrador') {
      throw new ForbiddenException('Esta acción es solo para administradores.');
    }
    return true;
  }
}