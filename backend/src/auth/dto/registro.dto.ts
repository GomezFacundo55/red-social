import {
  IsDateString, IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength,
} from 'class-validator';

export class RegistroDto {
  @IsString() @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsString() @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  apellido: string;

  @IsEmail({}, { message: 'El correo no es válido.' })
  correo: string;

  @IsString() @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres.' })
  usuario: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe tener una mayúscula.' })
  @Matches(/\d/, { message: 'La contraseña debe tener un número.' })
  password: string;

  @IsString() @IsNotEmpty({ message: 'Repetí la contraseña.' })
  repetirPassword: string;

  @IsDateString({}, { message: 'La fecha de nacimiento no es válida.' })
  fechaNacimiento: string;

  @IsString() @IsNotEmpty({ message: 'La descripción es obligatoria.' })
  @MaxLength(200, { message: 'La descripción no puede superar los 200 caracteres.' })
  descripcion: string;
}