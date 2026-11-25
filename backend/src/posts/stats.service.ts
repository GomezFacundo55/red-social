import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comentario, ComentarioDocument } from './schemas/comentario.schema.js';
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { ActivityService } from '../activity/activity.service.js';

const DIA_MS = 24 * 60 * 60 * 1000;
const MAX_DIAS = 366;

interface RangoFechas {
  desde: Date;
  hasta: Date;
  dias: string[];
}

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Publicacion.name) private publicacionModel: Model<PublicacionDocument>,
    @InjectModel(Comentario.name) private comentarioModel: Model<ComentarioDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private activityService: ActivityService,
  ) {}

  async publicacionesPorUsuario(desde: string, hasta: string) {
    const rango = this.validarRango(desde, hasta);
    return this.publicacionModel.aggregate([
      {
        $match: {
          eliminada: false,
          createdAt: { $gte: rango.desde, $lte: rango.hasta },
        },
      },
      { $group: { _id: '$autor', cantidad: { $sum: 1 } } },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      { $unwind: '$usuario' },
      {
        $project: {
          _id: 0,
          usuarioId: '$_id',
          etiqueta: { $concat: ['$usuario.nombre', ' ', '$usuario.apellido'] },
          usuario: '$usuario.usuario',
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1, etiqueta: 1 } },
    ]);
  }

  async comentariosPorFecha(desde: string, hasta: string) {
    const rango = this.validarRango(desde, hasta);
    const filas = await this.comentarioModel.aggregate([
      ...this.pipelineComentariosActivos(rango),
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'UTC',
            },
          },
          cantidad: { $sum: 1 },
        },
      },
    ]);
    const cantidades = new Map(filas.map((fila) => [fila._id, fila.cantidad]));
    return rango.dias.map((fecha) => ({ fecha, cantidad: cantidades.get(fecha) ?? 0 }));
  }

  async comentariosPorPublicacion(desde: string, hasta: string) {
    const rango = this.validarRango(desde, hasta);
    return this.comentarioModel.aggregate([
      ...this.pipelineComentariosActivos(rango),
      { $group: { _id: '$publicacion', cantidad: { $sum: 1 } } },
      {
        $lookup: {
          from: this.publicacionModel.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'publicacion',
        },
      },
      { $unwind: '$publicacion' },
      {
        $project: {
          _id: 0,
          publicacionId: '$_id',
          titulo: '$publicacion.titulo',
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1, titulo: 1 } },
    ]);
  }

  loginsPorUsuario(desde: string, hasta: string) {
    const rango = this.validarRango(desde, hasta);
    return this.activityService.loginsPorUsuario(rango.desde, rango.hasta);
  }

  visitasPerfilPorUsuario(desde: string, hasta: string) {
    const rango = this.validarRango(desde, hasta);
    return this.activityService.visitasPerfilPorUsuario(rango.desde, rango.hasta);
  }

  meGustaPorFecha(desde: string, hasta: string) {
    const rango = this.validarRango(desde, hasta);
    return this.activityService.meGustaPorFecha(rango.desde, rango.hasta, rango.dias);
  }

  private pipelineComentariosActivos(rango: RangoFechas) {
    return [
      {
        $match: {
          createdAt: { $gte: rango.desde, $lte: rango.hasta },
        },
      },
      {
        $lookup: {
          from: this.publicacionModel.collection.name,
          localField: 'publicacion',
          foreignField: '_id',
          as: 'publicacion',
        },
      },
      { $unwind: '$publicacion' },
      { $match: { 'publicacion.eliminada': false } },
    ];
  }

  private validarRango(desde: string, hasta: string): RangoFechas {
    const fechaDesde = this.fechaUtc(desde, 'desde', false);
    const fechaHasta = this.fechaUtc(hasta, 'hasta', true);
    const duracion = fechaHasta.getTime() - fechaDesde.getTime();
    if (duracion < 0) {
      throw new BadRequestException('La fecha inicial debe ser anterior a la fecha final.');
    }
    if (Math.floor(duracion / DIA_MS) + 1 > MAX_DIAS) {
      throw new BadRequestException('El rango de estadísticas no puede superar 366 días.');
    }

    const dias: string[] = [];
    for (let dia = fechaDesde.getTime(); dia <= fechaHasta.getTime(); dia += DIA_MS) {
      dias.push(new Date(dia).toISOString().slice(0, 10));
    }
    return { desde: fechaDesde, hasta: fechaHasta, dias };
  }

  private fechaUtc(valor: string, campo: string, finDelDia: boolean): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor ?? '')) {
      throw new BadRequestException(`El parámetro "${campo}" debe tener formato AAAA-MM-DD.`);
    }
    const fecha = new Date(`${valor}T${finDelDia ? '23:59:59.999' : '00:00:00.000'}Z`);
    if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) {
      throw new BadRequestException(`El parámetro "${campo}" no es una fecha válida.`);
    }
    return fecha;
  }
}
