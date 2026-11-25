import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { RegistroDto } from './dto/registro.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { ArchivoSubido } from './archivo-subido.js';
import type { UsuarioToken } from './jwt-auth.guard.js';

type DatosToken = Pick<UsuarioToken, 'sub' | 'usuario' | 'perfil'>;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private activityService: ActivityService,
  ) {}

  async registro(dto: RegistroDto, imagen?: ArchivoSubido) {
    const usuario = await this.usersService.crearUsuario(dto, imagen, 'usuario');

    const token = await this.firmar({
      sub: usuario._id.toString(),
      usuario: usuario.usuario,
      perfil: usuario.perfil,
    });
    const { password, ...datos } = usuario.toObject();
    return { token, usuario: datos };
  }

  async login(dto: LoginDto) {
    const usuario = await this.usersService.buscarPorCorreoOUsuario(dto.usuario);
    const passwordOk = usuario
      ? await bcrypt.compare(dto.password, usuario.password)
      : false;

    if (!usuario || !passwordOk) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }
    if (usuario.habilitado === false) {
      throw new UnauthorizedException(
        'Tu cuenta está deshabilitada. Contactá a un administrador.',
      );
    }

    await this.activityService.registrarIngreso(usuario._id.toString());
    const token = await this.firmar({
      sub: usuario._id.toString(),
      usuario: usuario.usuario,
      perfil: usuario.perfil,
    });
    const { password, ...datos } = usuario.toObject();
    return { token, usuario: datos };
  }

  async autorizar(token: UsuarioToken) {
    const usuario = await this.usuarioActivo(token.sub);
    const { password, ...datos } = usuario.toObject();
    return datos;
  }

  async refrescar(token: UsuarioToken) {
    await this.usuarioActivo(token.sub);
    const nuevo = await this.firmar({
      sub: token.sub,
      usuario: token.usuario,
      perfil: token.perfil,
    });
    return { token: nuevo };
  }

  private async usuarioActivo(id: string) {
    const usuario = await this.usersService.buscarPorId(id);
    if (!usuario) {
      throw new UnauthorizedException('El usuario ya no existe.');
    }
    if (usuario.habilitado === false) {
      throw new UnauthorizedException('Tu cuenta está deshabilitada.');
    }
    return usuario;
  }

  private firmar(datos: DatosToken) {
    return this.jwtService.signAsync(datos);
  }
}