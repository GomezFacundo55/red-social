import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import { Model, isValidObjectId } from 'mongoose';
import type { ArchivoSubido } from '../auth/archivo-subido.js';
import { RegistroDto } from '../auth/dto/registro.dto.js';
import { Imagen, ImagenDocument } from './schemas/imagen.schema.js';
import { User, UserDocument } from './schemas/user.schema.js';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Imagen.name) private imagenModel: Model<ImagenDocument>,
    private config: ConfigService,
  ) {}

  crear(datos: Partial<User>) {
    return this.userModel.create(datos);
  }

  // Lógica compartida por el registro público y el alta hecha por un administrador
  async crearUsuario(dto: RegistroDto, imagen: ArchivoSubido | undefined, perfil: string) {
    if (dto.password !== dto.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }
    if (!imagen) {
      throw new BadRequestException('La imagen de perfil es obligatoria.');
    }
    if (!TIPOS_PERMITIDOS.includes(imagen.mimetype)) {
      throw new BadRequestException('La imagen debe ser JPG, PNG, WEBP o GIF.');
    }
    if (await this.buscarPorCorreo(dto.correo)) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }
    if (await this.buscarPorUsuario(dto.usuario)) {
      throw new ConflictException('Ese nombre de usuario ya está en uso.');
    }

    const imagenId = await this.guardarImagen(imagen.mimetype, imagen.buffer);
    const baseUrl = this.config.get<string>('BASE_URL') ?? 'http://localhost:3000';
    const imagenPerfil = `${baseUrl}/users/imagen/${imagenId}`;
    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.crear({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correo: dto.correo,
      usuario: dto.usuario,
      password: passwordHash,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      descripcion: dto.descripcion,
      imagenPerfil,
      perfil,
    });
  }

  buscarPorCorreo(correo: string) {
    return this.userModel.findOne({ correo: correo.toLowerCase().trim() });
  }

  buscarPorUsuario(usuario: string) {
    return this.userModel.findOne({ usuario: usuario.trim() });
  }

  buscarPorCorreoOUsuario(identificador: string) {
    const valor = identificador.trim();
    return this.userModel.findOne({
      $or: [{ correo: valor.toLowerCase() }, { usuario: valor }],
    });
  }

  buscarPorId(id: string) {
    return isValidObjectId(id) ? this.userModel.findById(id) : null;
  }

  async listar(offset: number, limit: number) {
    const desde = Math.max(offset, 0);
    const cantidad = Math.min(Math.max(limit, 1), 50);
    const [items, total] = await Promise.all([
      this.userModel
        .find()
        .select('-password')
        .sort({ createdAt: -1, _id: -1 })
        .skip(desde)
        .limit(cantidad),
      this.userModel.countDocuments(),
    ]);
    return { items, total, offset: desde, limit: cantidad };
  }

  async obtenerPerfilPublico(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('El id del usuario no es válido.');
    }
    const usuario = await this.userModel
      .findOne({ _id: id, habilitado: { $ne: false } })
      .select('nombre apellido usuario perfil imagenPerfil descripcion createdAt')
      .lean();
    if (!usuario) {
      throw new NotFoundException('El usuario no existe o no está habilitado.');
    }
    return usuario;
  }

  async cambiarHabilitado(id: string, habilitado: boolean) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('El id del usuario no es válido.');
    }
    const usuario = await this.userModel
      .findByIdAndUpdate(id, { habilitado }, { new: true })
      .select('-password');
    if (!usuario) {
      throw new NotFoundException('El usuario no existe.');
    }
    return usuario;
  }

  async guardarImagen(tipo: string, datos: Buffer) {
    const imagen = await this.imagenModel.create({ tipo, datos });
    return imagen._id.toString();
  }

  obtenerImagen(id: string) {
    return this.imagenModel.findById(id);
  }
}