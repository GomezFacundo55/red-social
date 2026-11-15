import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { UsersService } from '../users/users.service.js';
import type { ArchivoSubido } from '../auth/archivo-subido.js';
import type { UsuarioToken } from '../auth/jwt-auth.guard.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema.js';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DATOS_AUTOR = 'nombre apellido usuario imagenPerfil';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Publicacion.name) private publicacionModel: Model<PublicacionDocument>,
    private usersService: UsersService,
    private config: ConfigService,
  ) {}

  async crear(autorId: string, dto: CrearPublicacionDto, imagen?: ArchivoSubido) {
    let imagenUrl: string | undefined;

    if (imagen) {
      if (!TIPOS_PERMITIDOS.includes(imagen.mimetype)) {
        throw new BadRequestException('La imagen debe ser JPG, PNG, WEBP o GIF.');
      }
      const imagenId = await this.usersService.guardarImagen(imagen.mimetype, imagen.buffer);
      const baseUrl = this.config.get<string>('BASE_URL') ?? 'http://localhost:3000';
      imagenUrl = `${baseUrl}/users/imagen/${imagenId}`;
    }

    const publicacion = await this.publicacionModel.create({
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      imagenUrl,
      autor: new Types.ObjectId(autorId),
    });

    return publicacion.populate('autor', DATOS_AUTOR);
  }

  async listar(orden: string, offset: number, limit: number, usuario?: string) {
    if (orden !== 'fecha' && orden !== 'meGusta') {
      throw new BadRequestException('El orden debe ser "fecha" o "meGusta".');
    }

    const filtro: Record<string, unknown> = { eliminada: false };
    if (usuario) {
      if (!isValidObjectId(usuario)) {
        throw new BadRequestException('El usuario indicado no es válido.');
      }
      filtro.autor = new Types.ObjectId(usuario);
    }

    const desde = Math.max(offset, 0);
    const cantidad = Math.min(Math.max(limit, 1), 50);
    const criterio: Record<string, 1 | -1> =
      orden === 'meGusta'
        ? { cantidadMeGusta: -1, createdAt: -1, _id: -1 }
        : { createdAt: -1, _id: -1 };

    const [items, total] = await Promise.all([
      this.publicacionModel
        .find(filtro)
        .sort(criterio)
        .skip(desde)
        .limit(cantidad)
        .populate('autor', DATOS_AUTOR),
      this.publicacionModel.countDocuments(filtro),
    ]);

    return { items, total, offset: desde, limit: cantidad };
  }

  async eliminar(id: string, usuario: UsuarioToken) {
    const publicacion = await this.obtenerActiva(id);

    const esAutor = publicacion.autor.toString() === usuario.sub;
    const esAdministrador = usuario.perfil === 'administrador';
    if (!esAutor && !esAdministrador) {
      throw new ForbiddenException(
        'Solo el autor o un administrador pueden eliminar la publicación.',
      );
    }

    publicacion.eliminada = true;
    await publicacion.save();
    return { mensaje: 'Publicación eliminada.' };
  }

  async darMeGusta(id: string, usuarioId: string) {
    await this.obtenerActiva(id);
    const usuario = new Types.ObjectId(usuarioId);

    const actualizada = await this.publicacionModel
      .findOneAndUpdate(
        { _id: id, eliminada: false, meGusta: { $ne: usuario } },
        { $addToSet: { meGusta: usuario }, $inc: { cantidadMeGusta: 1 } },
        { new: true },
      )
      .populate('autor', DATOS_AUTOR);

    if (!actualizada) {
      throw new ConflictException('Ya le diste me gusta a esta publicación.');
    }
    return actualizada;
  }

  async quitarMeGusta(id: string, usuarioId: string) {
    await this.obtenerActiva(id);
    const usuario = new Types.ObjectId(usuarioId);

    const actualizada = await this.publicacionModel
      .findOneAndUpdate(
        { _id: id, eliminada: false, meGusta: usuario },
        { $pull: { meGusta: usuario }, $inc: { cantidadMeGusta: -1 } },
        { new: true },
      )
      .populate('autor', DATOS_AUTOR);

    if (!actualizada) {
      throw new BadRequestException('No le habías dado me gusta a esta publicación.');
    }
    return actualizada;
  }

  private async obtenerActiva(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('El id de la publicación no es válido.');
    }
    const publicacion = await this.publicacionModel.findOne({ _id: id, eliminada: false });
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe.');
    }
    return publicacion;
  }
}