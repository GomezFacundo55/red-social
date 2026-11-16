import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Comentario, ComentarioDocument } from './schemas/comentario.schema.js';
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema.js';

const DATOS_AUTOR = 'nombre apellido usuario imagenPerfil';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name) private comentarioModel: Model<ComentarioDocument>,
    @InjectModel(Publicacion.name) private publicacionModel: Model<PublicacionDocument>,
  ) {}

  async listar(postId: string, offset: number, limit: number) {
    await this.verificarPublicacion(postId);

    const desde = Math.max(offset, 0);
    const cantidad = Math.min(Math.max(limit, 1), 50);
    const filtro = { publicacion: new Types.ObjectId(postId) };

    const [items, total] = await Promise.all([
      this.comentarioModel
        .find(filtro)
        .sort({ createdAt: -1, _id: -1 })
        .skip(desde)
        .limit(cantidad)
        .populate('autor', DATOS_AUTOR),
      this.comentarioModel.countDocuments(filtro),
    ]);

    return { items, total, offset: desde, limit: cantidad };
  }

  async crear(postId: string, autorId: string, texto: string) {
    await this.verificarPublicacion(postId);

    const comentario = await this.comentarioModel.create({
      publicacion: new Types.ObjectId(postId),
      autor: new Types.ObjectId(autorId),
      texto: texto.trim(),
    });
    await this.publicacionModel.updateOne({ _id: postId }, { $inc: { cantidadComentarios: 1 } });

    return comentario.populate('autor', DATOS_AUTOR);
  }

  async modificar(postId: string, comentarioId: string, usuarioId: string, texto: string) {
    await this.verificarPublicacion(postId);
    if (!isValidObjectId(comentarioId)) {
      throw new BadRequestException('El id del comentario no es válido.');
    }

    const comentario = await this.comentarioModel.findOne({
      _id: new Types.ObjectId(comentarioId),
      publicacion: new Types.ObjectId(postId),
    });
    if (!comentario) {
      throw new NotFoundException('El comentario no existe.');
    }
    if (comentario.autor.toString() !== usuarioId) {
      throw new ForbiddenException('Solo quien escribió el comentario puede editarlo.');
    }

    comentario.texto = texto.trim();
    comentario.modificado = true;
    await comentario.save();

    return comentario.populate('autor', DATOS_AUTOR);
  }

  private async verificarPublicacion(postId: string) {
    if (!isValidObjectId(postId)) {
      throw new BadRequestException('El id de la publicación no es válido.');
    }
    const existe = await this.publicacionModel.exists({ _id: postId, eliminada: false });
    if (!existe) {
      throw new NotFoundException('La publicación no existe.');
    }
  }
}