import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module.js';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosService } from './comentarios.service.js';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
import { Comentario, ComentarioSchema } from './schemas/comentario.schema.js';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
    UsersModule,
  ],
  controllers: [PostsController, ComentariosController],
  providers: [PostsService, ComentariosService],
})
export class PostsModule {}