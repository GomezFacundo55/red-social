import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PublicacionDocument = HydratedDocument<Publicacion>;

@Schema({ timestamps: true })
export class Publicacion {
  @Prop({ required: true, trim: true, maxlength: 100 }) titulo: string;
  @Prop({ required: true, trim: true, maxlength: 1000 }) descripcion: string;
  @Prop() imagenUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  autor: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  meGusta: Types.ObjectId[];

  @Prop({ default: 0 }) cantidadMeGusta: number;
  @Prop({ default: 0 }) cantidadComentarios: number;

  @Prop({ default: false, index: true }) eliminada: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);