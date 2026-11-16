import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Orden, PaginaPublicaciones, Publicacion } from '../models/publicacion';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl.replace(/\/+$/, '')}/posts`;

  listar(orden: Orden, offset: number, limit: number, usuario?: string) {
    let params = new HttpParams().set('orden', orden).set('offset', offset).set('limit', limit);
    if (usuario) params = params.set('usuario', usuario);
    return this.http.get<PaginaPublicaciones>(this.api, { params });
  }

  crear(datos: FormData) {
    return this.http.post<Publicacion>(this.api, datos);
  }

    obtener(id: string) {
    return this.http.get<Publicacion>(`${this.api}/${id}`);
  }

  eliminar(id: string) {
    return this.http.delete<{ mensaje: string }>(`${this.api}/${id}`);
  }

  darMeGusta(id: string) {
    return this.http.post<Publicacion>(`${this.api}/${id}/me-gusta`, {});
  }

  quitarMeGusta(id: string) {
    return this.http.delete<Publicacion>(`${this.api}/${id}/me-gusta`);
  }
}