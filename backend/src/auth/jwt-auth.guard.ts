import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface UsuarioToken {
  sub: string;
  usuario: string;
  perfil: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const cabecera: string | undefined = req.headers['authorization'];
    const [tipo, token] = cabecera?.split(' ') ?? [];

    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Tenés que iniciar sesión.');
    }
    try {
      req.usuario = await this.jwtService.verifyAsync<UsuarioToken>(token);
    } catch {
      throw new UnauthorizedException('Tu sesión es inválida o venció.');
    }
    return true;
  }
}