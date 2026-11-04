import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { User, UserSchema } from './schemas/user.schema.js';
import { Imagen, ImagenSchema } from './schemas/imagen.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Imagen.name, schema: ImagenSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}