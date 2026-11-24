import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'numeroCompacto', standalone: true })
export class NumeroCompactoPipe implements PipeTransform {
  private formato = new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  transform(valor: number | null | undefined): string {
    return this.formato.format(valor ?? 0);
  }
}
