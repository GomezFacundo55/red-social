import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  crear(datos: Partial<User>) {
    return this.userModel.create(datos);
  }

  buscarPorCorreo(correo: string) {
    return this.userModel.findOne({ correo: correo.toLowerCase().trim() });
  }

  buscarPorUsuario(usuario: string) {
    return this.userModel.findOne({ usuario: usuario.trim() });
  }
}