import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

interface Sesion {
  token: string;
  usuario: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  private sesion = signal<Sesion | null>(this.leerSesion());

  estaLogueado = computed(() => this.sesion() !== null);
  usuarioActual = computed(() => this.sesion()?.usuario ?? null);

  get token(): string | null {
    return this.sesion()?.token ?? null;
  }

  registro(datos: FormData) {
    return this.http.post(`${this.api}/auth/registro`, datos);
  }

  login(datos: { usuario: string; password: string }) {
    return this.http.post<{ token: string; usuario: unknown }>(`${this.api}/auth/login`, datos);
  }

  guardarSesion(token: string, usuario: unknown) {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    this.sesion.set({ token, usuario });
  }

  cerrarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.sesion.set(null);
  }

  private leerSesion(): Sesion | null {
    try {
      const token = localStorage.getItem(CLAVE_TOKEN);
      const usuario = localStorage.getItem(CLAVE_USUARIO);
      return token && usuario ? { token, usuario: JSON.parse(usuario) } : null;
    } catch {
      return null;
    }
  }
}