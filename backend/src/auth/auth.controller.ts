import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service.js';
import { RegistroDto } from './dto/registro.dto.js';
import type { ArchivoSubido } from './archivo-subido.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registro')
  @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: 2 * 1024 * 1024 } }))
  registro(@Body() dto: RegistroDto, @UploadedFile() imagen?: ArchivoSubido) {
    return this.authService.registro(dto, imagen);
  }
}