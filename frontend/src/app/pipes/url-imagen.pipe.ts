import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

@Pipe({ name: 'urlImagen' })
export class UrlImagenPipe implements PipeTransform {
  private api = environment.apiUrl.replace(/\/+$/, '');

  transform(url: string | null | undefined): string {
    if (!url) return '';
    const coincidencia = url.match(/\/users\/imagen\/([a-f\d]{24})\/?$/i);
    return coincidencia ? `${this.api}/users/imagen/${coincidencia[1]}` : url;
  }
}