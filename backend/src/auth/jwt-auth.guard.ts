import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';

export interface UsuarioToken {
  sub: string;
  usuario: string;
  perfil: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      usuario?: UsuarioToken;
    }>();
    const cabecera: string | undefined = req.headers['authorization'];
    const [tipo, token] = cabecera?.split(' ') ?? [];

    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Tenés que iniciar sesión.');
    }
    let usuarioToken: UsuarioToken;
    try {
      usuarioToken = await this.jwtService.verifyAsync<UsuarioToken>(token);
    } catch {
      throw new UnauthorizedException('Tu sesión es inválida o venció.');
    }

    const usuario = await this.usersService.buscarPorId(usuarioToken.sub);
    if (!usuario || usuario.habilitado === false) {
      throw new UnauthorizedException('Tu cuenta está deshabilitada o ya no existe.');
    }

    req.usuario = {
      ...usuarioToken,
      usuario: usuario.usuario,
      perfil: usuario.perfil,
    };
    return true;
  }
}