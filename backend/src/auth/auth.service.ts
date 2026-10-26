import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { UsersService } from '../users/users.service.js';
import { RegistroDto } from './dto/registro.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { ArchivoSubido } from './archivo-subido.js';

const EXTENSIONES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

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
    const extension = EXTENSIONES[imagen.mimetype];
    if (!extension) {
      throw new BadRequestException('La imagen debe ser JPG, PNG, WEBP o GIF.');
    }
    if (await this.usersService.buscarPorCorreo(dto.correo)) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }
    if (await this.usersService.buscarPorUsuario(dto.usuario)) {
      throw new ConflictException('Ese nombre de usuario ya está en uso.');
    }

    // Guardar la imagen en disco y armar su URL
    const carpeta = join(process.cwd(), 'uploads');
    await mkdir(carpeta, { recursive: true });
    const nombreArchivo = `${randomUUID()}${extension}`;
    await writeFile(join(carpeta, nombreArchivo), imagen.buffer);
    const baseUrl = this.config.get<string>('BASE_URL') ?? 'http://localhost:3000';
    const imagenPerfil = `${baseUrl}/uploads/${nombreArchivo}`;

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
    return datos; // sin la contraseña
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