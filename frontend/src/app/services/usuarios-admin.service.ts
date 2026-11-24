import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { PaginaUsuarios, UsuarioAdmin } from '../models/usuario-admin';

@Injectable({ providedIn: 'root' })
export class UsuariosAdminService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl.replace(/\/+$/, '')}/users`;

  listar(offset: number, limit: number) {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<PaginaUsuarios>(this.api, { params });
  }

  crear(datos: FormData) {
    return this.http.post<UsuarioAdmin>(this.api, datos);
  }

  deshabilitar(id: string) {
    return this.http.delete<UsuarioAdmin>(`${this.api}/${id}`);
  }

  habilitar(id: string) {
    return this.http.post<UsuarioAdmin>(`${this.api}/${id}/habilitar`, {});
  }
}
