import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UsuarioToken } from '../auth/jwt-auth.guard.js';
import { ComentariosService } from './comentarios.service.js';
import { ComentarioDto } from './dto/comentario.dto.js';

type PeticionConUsuario = { usuario: UsuarioToken };

@Controller('posts/:postId/comentarios')
@UseGuards(JwtAuthGuard)
export class ComentariosController {
  constructor(private comentariosService: ComentariosService) {}

  @Get()
  listar(
    @Param('postId') postId: string,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.comentariosService.listar(postId, offset, limit);
  }

  @Post()
  crear(
    @Req() req: PeticionConUsuario,
    @Param('postId') postId: string,
    @Body() dto: ComentarioDto,
  ) {
    return this.comentariosService.crear(postId, req.usuario.sub, dto.texto);
  }

  @Put(':comentarioId')
  modificar(
    @Req() req: PeticionConUsuario,
    @Param('postId') postId: string,
    @Param('comentarioId') comentarioId: string,
    @Body() dto: ComentarioDto,
  ) {
    return this.comentariosService.modificar(postId, comentarioId, req.usuario.sub, dto.texto);
  }
}