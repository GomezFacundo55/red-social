import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { Actividad, ActividadDocument, TipoActividad } from './activity.schema.js';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Actividad.name) private activityModel: Model<ActividadDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  registrarIngreso(usuarioId: string) {
    return this.activityModel.create({
      tipo: 'ingreso',
      actor: new Types.ObjectId(usuarioId),
    });
  }

  registrarVisitaPerfil(actorId: string, perfilId: string) {
    if (actorId.toLowerCase() === perfilId.toLowerCase()) return Promise.resolve(null);
    return this.activityModel.create({
      tipo: 'visitaPerfil',
      actor: new Types.ObjectId(actorId),
      perfilVisitado: new Types.ObjectId(perfilId),
    });
  }

  registrarMeGusta(usuarioId: string, publicacionId: string) {
    return this.activityModel.create({
      tipo: 'meGusta',
      actor: new Types.ObjectId(usuarioId),
      publicacion: new Types.ObjectId(publicacionId),
    });
  }

  loginsPorUsuario(desde: Date, hasta: Date) {
    return this.contarPorUsuario('ingreso', 'actor', desde, hasta);
  }

  visitasPerfilPorUsuario(desde: Date, hasta: Date) {
    return this.contarPorUsuario('visitaPerfil', 'perfilVisitado', desde, hasta, {
      perfilVisitado: { $exists: true },
      $expr: { $ne: ['$actor', '$perfilVisitado'] },
    });
  }

  async meGustaPorFecha(desde: Date, hasta: Date, dias: string[]) {
    const filas = await this.activityModel.aggregate([
      {
        $match: {
          tipo: 'meGusta',
          createdAt: { $gte: desde, $lte: hasta },
        },
      },
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
    return dias.map((fecha) => ({ fecha, cantidad: cantidades.get(fecha) ?? 0 }));
  }

  private contarPorUsuario(
    tipo: TipoActividad,
    campo: 'actor' | 'perfilVisitado',
    desde: Date,
    hasta: Date,
    filtrosAdicionales: Record<string, unknown> = {},
  ) {
    return this.activityModel.aggregate([
      {
        $match: {
          tipo,
          createdAt: { $gte: desde, $lte: hasta },
          ...filtrosAdicionales,
        },
      },
      { $group: { _id: `$${campo}`, cantidad: { $sum: 1 } } },
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
          usuarioId: { $toString: '$_id' },
          etiqueta: { $concat: ['$usuario.nombre', ' ', '$usuario.apellido'] },
          usuario: '$usuario.usuario',
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1, etiqueta: 1 } },
    ]);
  }
}
