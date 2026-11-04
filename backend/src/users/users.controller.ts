import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

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
}