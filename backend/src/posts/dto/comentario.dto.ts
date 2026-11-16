import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class ComentarioDto {
  @IsString({ message: 'El comentario debe ser texto.' })
  @IsNotEmpty({ message: 'El comentario no puede estar vacío.' })
  @Matches(/\S/, { message: 'El comentario no puede estar vacío.' })
  @MaxLength(500, { message: 'El comentario no puede superar los 500 caracteres.' })
  texto: string;
}