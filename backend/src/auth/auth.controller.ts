import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service.js';
import { RegistroDto } from './dto/registro.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { UsuarioToken } from './jwt-auth.guard.js';
import type { ArchivoSubido } from './archivo-subido.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registro')
  @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: 2 * 1024 * 1024 } }))
  registro(@Body() dto: RegistroDto, @UploadedFile() imagen?: ArchivoSubido) {
    return this.authService.registro(dto, imagen);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('autorizar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  autorizar(@Req() req: { usuario: UsuarioToken }) {
    return this.authService.autorizar(req.usuario);
  }

  @Post('refrescar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  refrescar(@Req() req: { usuario: UsuarioToken }) {
    return this.authService.refrescar(req.usuario);
  }
}