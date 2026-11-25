import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ActividadDocument = HydratedDocument<Actividad>;
export type TipoActividad = 'ingreso' | 'visitaPerfil' | 'meGusta';

@Schema({ timestamps: true })
export class Actividad {
  @Prop({
    type: String,
    required: true,
    enum: ['ingreso', 'visitaPerfil', 'meGusta'],
    index: true,
  })
  tipo: TipoActividad;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  actor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  perfilVisitado?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Publicacion' })
  publicacion?: Types.ObjectId;
}

export const ActividadSchema = SchemaFactory.createForClass(Actividad);
ActividadSchema.index({ tipo: 1, createdAt: 1 });
