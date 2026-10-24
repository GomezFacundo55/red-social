import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true }) nombre: string;
  @Prop({ required: true }) apellido: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) correo: string;
  @Prop({ required: true, unique: true, trim: true }) usuario: string;
  @Prop({ required: true }) password: string;
  @Prop({ required: true }) fechaNacimiento: Date;
  @Prop({ required: true, maxlength: 200 }) descripcion: string;
  @Prop({ required: true }) imagenPerfil: string;
  @Prop({ enum: ['usuario', 'administrador'], default: 'usuario' }) perfil: string;
}

export const UserSchema = SchemaFactory.createForClass(User);