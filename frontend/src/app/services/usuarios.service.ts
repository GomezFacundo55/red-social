import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { UsuarioPerfil } from '../models/usuario-perfil';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl.replace(/\/+$/, '')}/users`;

  obtenerPerfil(id: string) {
    return this.http.get<UsuarioPerfil>(`${this.api}/${encodeURIComponent(id)}/perfil`);
  }
}
