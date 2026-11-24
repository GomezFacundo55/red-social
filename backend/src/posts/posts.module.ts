import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module.js';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosService } from './comentarios.service.js';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
import { Comentario, ComentarioSchema } from './schemas/comentario.schema.js';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema.js';
import { StatsController } from './stats.controller.js';
import { StatsService } from './stats.service.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UsersModule,
  ],
  controllers: [PostsController, ComentariosController, StatsController],
  providers: [PostsService, ComentariosService, StatsService, JwtAuthGuard, AdminGuard],
})
export class PostsModule {}