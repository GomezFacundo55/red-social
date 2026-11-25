import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

@Pipe({ name: 'urlImagen', standalone: true })
export class UrlImagenPipe implements PipeTransform {
  private api = environment.apiUrl.replace(/\/+$/, '');

  transform(url: string | null | undefined): string {
    if (!url) return '';
    const coincidencia = url.match(/\/users\/imagen\/([a-f\d]{24})\/?(?:[?#].*)?$/i);
    if (coincidencia) return `${this.api}/users/imagen/${coincidencia[1]}`;

    const imagenLegada = url.match(
      /\/uploads\/([a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}\.(?:jpe?g|png|webp))(?:[?#].*)?$/i,
    );
    return imagenLegada ? `/uploads/${imagenLegada[1]}` : url;
  }
}