import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';
const CLAVE_RECIBIDO = 'tokenRecibido';

interface Sesion {
  token: string;
  usuario: any;
  recibidoEn: number;
}

// Cuánto dura un token (exp - iat), leído de su contenido
function duracionDelToken(token: string): number | null {
  try {
    const parte = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(parte), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return typeof payload.exp === 'number' && typeof payload.iat === 'number'
      ? (payload.exp - payload.iat) * 1000
      : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = environment.apiUrl.replace(/\/+$/, '');

  private sesion = signal<Sesion | null>(this.leerSesion());

  estaLogueado = computed(() => this.sesion() !== null);
  usuarioActual = computed(() => this.sesion()?.usuario ?? null);

  // Momento (en la hora de esta computadora) en que vence la sesión
  vencimiento = computed(() => {
    const sesion = this.sesion();
    if (!sesion) return null;
    const duracion = duracionDelToken(sesion.token);
    return duracion === null ? null : sesion.recibidoEn + duracion;
  });

  get token(): string | null {
    return this.sesion()?.token ?? null;
  }

  registro(datos: FormData) {
    return this.http.post<{ token: string; usuario: unknown }>(`${this.api}/auth/registro`, datos);
  }

  login(datos: { usuario: string; password: string }) {
    return this.http.post<{ token: string; usuario: unknown }>(`${this.api}/auth/login`, datos);
  }

  autorizar() {
    return this.http.post<any>(`${this.api}/auth/autorizar`, {});
  }

  refrescar() {
    return this.http.post<{ token: string }>(`${this.api}/auth/refrescar`, {});
  }

  guardarSesion(token: string, usuario: unknown) {
    this.persistir(token, usuario, Date.now());
  }

  actualizarToken(token: string) {
    const sesion = this.sesion();
    if (sesion) this.persistir(token, sesion.usuario, Date.now());
  }

  actualizarUsuario(usuario: unknown) {
    const sesion = this.sesion();
    if (sesion) this.persistir(sesion.token, usuario, sesion.recibidoEn);
  }

  cerrarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    localStorage.removeItem(CLAVE_RECIBIDO);
    this.sesion.set(null);
  }

  private persistir(token: string, usuario: unknown, recibidoEn: number) {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    localStorage.setItem(CLAVE_RECIBIDO, String(recibidoEn));
    this.sesion.set({ token, usuario, recibidoEn });
  }

  private leerSesion(): Sesion | null {
    try {
      const token = localStorage.getItem(CLAVE_TOKEN);
      const usuario = localStorage.getItem(CLAVE_USUARIO);
      if (!token || !usuario) return null;
      const recibido = Number(localStorage.getItem(CLAVE_RECIBIDO)) || Date.now();
      return { token, usuario: JSON.parse(usuario), recibidoEn: recibido };
    } catch {
      return null;
    }
  }
}