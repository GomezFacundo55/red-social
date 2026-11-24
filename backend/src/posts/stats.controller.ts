import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { StatsService } from './stats.service.js';

@Controller('posts/estadisticas')
@UseGuards(JwtAuthGuard, AdminGuard)
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query('desde') desde: string, @Query('hasta') hasta: string) {
    return this.statsService.publicacionesPorUsuario(desde, hasta);
  }

  @Get('comentarios-por-fecha')
  comentariosPorFecha(@Query('desde') desde: string, @Query('hasta') hasta: string) {
    return this.statsService.comentariosPorFecha(desde, hasta);
  }

  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query('desde') desde: string, @Query('hasta') hasta: string) {
    return this.statsService.comentariosPorPublicacion(desde, hasta);
  }
}
