import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { AdminGuard } from '../auth/admin.guard.js';
import type { ArchivoSubido } from '../auth/archivo-subido.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UsuarioToken } from '../auth/jwt-auth.guard.js';
import { CrearUsuarioDto } from '../auth/dto/crear-usuario.dto.js';
import { UsersService } from './users.service.js';

type PeticionConUsuario = { usuario: UsuarioToken };

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Pública a propósito: las fotos se piden con <img>, que no puede enviar el token
  @Get('imagen/:id')
  async imagen(@Param('id') id: string, @Res() res: Response) {
    const imagen = isValidObjectId(id) ? await this.usersService.obtenerImagen(id) : null;
    if (!imagen) {
      throw new NotFoundException('Imagen no encontrada.');
    }
    res.set({
      'Content-Type': imagen.tipo,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(imagen.datos);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  listar(
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.listar(offset, limit);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async crear(@Body() dto: CrearUsuarioDto, @UploadedFile() imagen?: ArchivoSubido) {
    const usuario = await this.usersService.crearUsuario(dto, imagen, dto.perfil);
    const { password, ...datos } = usuario.toObject();
    return datos;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deshabilitar(@Req() req: PeticionConUsuario, @Param('id') id: string) {
    if (id.toLowerCase() === req.usuario.sub.toLowerCase()) {
      throw new BadRequestException('No podés deshabilitar tu propia cuenta.');
    }
    return this.usersService.cambiarHabilitado(id, false);
  }

  @Post(':id/habilitar')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  habilitar(@Param('id') id: string) {
    return this.usersService.cambiarHabilitado(id, true);
  }
}