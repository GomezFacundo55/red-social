import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';
import { Imagen, ImagenDocument } from './schemas/imagen.schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Imagen.name) private imagenModel: Model<ImagenDocument>,
  ) {}

  crear(datos: Partial<User>) {
    return this.userModel.create(datos);
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

  async guardarImagen(tipo: string, datos: Buffer) {
    const imagen = await this.imagenModel.create({ tipo, datos });
    return imagen._id.toString();
  }

  obtenerImagen(id: string) {
    return this.imagenModel.findById(id);
  }
}