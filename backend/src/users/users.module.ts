import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { User, UserSchema } from './schemas/user.schema.js';
import { Imagen, ImagenSchema } from './schemas/imagen.schema.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { ActivityModule } from '../activity/activity.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Imagen.name, schema: ImagenSchema },
    ]),
    ActivityModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtAuthGuard, AdminGuard],
  exports: [UsersService],
})
export class UsersModule {}