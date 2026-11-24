import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'iniciales', standalone: true })
export class InicialesPipe implements PipeTransform {
  transform(nombre: string | null | undefined, apellido = ''): string {
    return `${nombre?.trim().charAt(0) ?? ''}${apellido.trim().charAt(0)}`.toUpperCase();
  }
}
