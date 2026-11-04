import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ImagenDocument = HydratedDocument<Imagen>;

@Schema({ timestamps: true })
export class Imagen {
  @Prop({ required: true }) tipo: string;
  @Prop({ required: true, type: Buffer }) datos: Buffer;
}

export const ImagenSchema = SchemaFactory.createForClass(Imagen);