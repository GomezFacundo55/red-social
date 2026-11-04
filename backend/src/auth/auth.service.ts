import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegistroDto } from './dto/registro.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { ArchivoSubido } from './archivo-subido.js';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

  async registro(dto: RegistroDto, imagen?: ArchivoSubido) {
    if (dto.password !== dto.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }
    if (!imagen) {
      throw new BadRequestException('La imagen de perfil es obligatoria.');
    }
    if (!TIPOS_PERMITIDOS.includes(imagen.mimetype)) {
      throw new BadRequestException('La imagen debe ser JPG, PNG, WEBP o GIF.');
    }
    if (await this.usersService.buscarPorCorreo(dto.correo)) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }
    if (await this.usersService.buscarPorUsuario(dto.usuario)) {
      throw new ConflictException('Ese nombre de usuario ya está en uso.');
    }

    // Guardar la imagen en la base y armar su URL
    const imagenId = await this.usersService.guardarImagen(imagen.mimetype, imagen.buffer);
    const baseUrl = this.config.get<string>('BASE_URL') ?? 'http://localhost:3000';
    const imagenPerfil = `${baseUrl}/users/imagen/${imagenId}`;

    // Encriptar la contraseña y crear el usuario
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const usuario = await this.usersService.crear({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correo: dto.correo,
      usuario: dto.usuario,
      password: passwordHash,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      descripcion: dto.descripcion,
      imagenPerfil,
    });

    const { password, ...datos } = usuario.toObject();
    return datos;
  }

  async login(dto: LoginDto) {
    const usuario = await this.usersService.buscarPorCorreoOUsuario(dto.usuario);
    const passwordOk = usuario
      ? await bcrypt.compare(dto.password, usuario.password)
      : false;

    if (!usuario || !passwordOk) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    const token = await this.jwtService.signAsync({
      sub: usuario._id.toString(),
      usuario: usuario.usuario,
      perfil: usuario.perfil,
    });

    const { password, ...datos } = usuario.toObject();
    return { token, usuario: datos };
  }
}