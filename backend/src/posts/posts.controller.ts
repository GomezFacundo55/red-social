import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UsuarioToken } from '../auth/jwt-auth.guard.js';
import type { ArchivoSubido } from '../auth/archivo-subido.js';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto.js';
import { PostsService } from './posts.service.js';

type PeticionConUsuario = { usuario: UsuarioToken };

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: 2 * 1024 * 1024 } }))
  crear(
    @Req() req: PeticionConUsuario,
    @Body() dto: CrearPublicacionDto,
    @UploadedFile() imagen?: ArchivoSubido,
  ) {
    return this.postsService.crear(req.usuario.sub, dto, imagen);
  }

  @Get()
  listar(
    @Query('orden') orden: string = 'fecha',
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('usuario') usuario?: string,
  ) {
    return this.postsService.listar(orden, offset, limit, usuario);
  }

  @Delete(':id')
  eliminar(@Req() req: PeticionConUsuario, @Param('id') id: string) {
    return this.postsService.eliminar(id, req.usuario);
  }

  @Post(':id/me-gusta')
  darMeGusta(@Req() req: PeticionConUsuario, @Param('id') id: string) {
    return this.postsService.darMeGusta(id, req.usuario.sub);
  }

  @Delete(':id/me-gusta')
  quitarMeGusta(@Req() req: PeticionConUsuario, @Param('id') id: string) {
    return this.postsService.quitarMeGusta(id, req.usuario.sub);
  }
}