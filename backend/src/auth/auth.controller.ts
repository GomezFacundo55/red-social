import { Body, Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';
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
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
}
  
}