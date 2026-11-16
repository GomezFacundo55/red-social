import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Comentario, PaginaComentarios } from '../models/publicacion';

@Injectable({ providedIn: 'root' })
export class ComentariosService {
  private http = inject(HttpClient);
  private api = environment.apiUrl.replace(/\/+$/, '');

  private url(postId: string) {
    return `${this.api}/posts/${postId}/comentarios`;
  }

  listar(postId: string, offset: number, limit: number) {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<PaginaComentarios>(this.url(postId), { params });
  }

  crear(postId: string, texto: string) {
    return this.http.post<Comentario>(this.url(postId), { texto });
  }

  modificar(postId: string, comentarioId: string, texto: string) {
    return this.http.put<Comentario>(`${this.url(postId)}/${comentarioId}`, { texto });
  }
}