import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

export interface PuntoEstadistico {
  etiqueta: string;
  cantidad: number;
}

export interface PublicacionesPorUsuario {
  usuarioId: string;
  etiqueta: string;
  usuario: string;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl.replace(/\/+$/, '')}/posts/estadisticas`;

  publicacionesPorUsuario(desde: string, hasta: string) {
    return this.http.get<PublicacionesPorUsuario[]>(`${this.api}/publicaciones-por-usuario`, {
      params: this.rango(desde, hasta),
    });
  }

  comentariosPorFecha(desde: string, hasta: string) {
    return this.http.get<Array<{ fecha: string; cantidad: number }>>(
      `${this.api}/comentarios-por-fecha`,
      { params: this.rango(desde, hasta) },
    );
  }

  comentariosPorPublicacion(desde: string, hasta: string) {
    return this.http.get<Array<{ titulo: string; cantidad: number }>>(
      `${this.api}/comentarios-por-publicacion`,
      { params: this.rango(desde, hasta) },
    );
  }

  loginsPorUsuario(desde: string, hasta: string) {
    return this.http.get<PublicacionesPorUsuario[]>(`${this.api}/logins-por-usuario`, {
      params: this.rango(desde, hasta),
    });
  }

  visitasPerfilPorUsuario(desde: string, hasta: string) {
    return this.http.get<PublicacionesPorUsuario[]>(`${this.api}/visitas-perfil`, {
      params: this.rango(desde, hasta),
    });
  }

  meGustaPorFecha(desde: string, hasta: string) {
    return this.http.get<Array<{ fecha: string; cantidad: number }>>(
      `${this.api}/me-gusta-por-fecha`,
      { params: this.rango(desde, hasta) },
    );
  }

  private rango(desde: string, hasta: string) {
    return new HttpParams().set('desde', desde).set('hasta', hasta);
  }
}
