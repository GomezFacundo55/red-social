import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

type EstadoModal = 'por-vencer' | 'vencida' | null;

const AVISO_ANTES_MS = 30 * 1000; // PRUEBA: avisar 30 segundos antes. Valor real del enunciado: 5 * 60 * 1000
const RUTAS_PUBLICAS = ['/login', '/registro'];

@Injectable({ providedIn: 'root' })
export class SesionService {
  private auth = inject(AuthService);
  private router = inject(Router);

  iniciando = signal(true);
  modal = signal<EstadoModal>(null);
  extendiendo = signal(false);
  errorExtender = signal('');
  restante = signal(0);

  textoRestante = computed(() => {
    const segundos = Math.round(this.restante() / 1000);
    if (segundos >= 60) {
      const minutos = Math.round(segundos / 60);
      return `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    }
    return `${segundos} segundos`;
  });

  private temporizadorAviso?: ReturnType<typeof setTimeout>;
  private temporizadorVencimiento?: ReturnType<typeof setTimeout>;

  constructor() {
    // Cada vez que cambia el vencimiento (login, refresco, cierre), se reprograman los avisos
    effect(() => {
      const vencimiento = this.auth.vencimiento();
      untracked(() => this.programar(vencimiento));
    });
  }

  // Al abrir la aplicación: validar el token contra /auth/autorizar
  iniciar() {
    const ruta = window.location.pathname;
    const esPublica = RUTAS_PUBLICAS.includes(ruta);
    const esInicio = ruta === '/' || ruta === '';

    if (!this.auth.token) {
      this.terminar(esPublica || esInicio ? null : '/login');
      return;
    }

    this.auth.autorizar().subscribe({
      next: (usuario) => {
        this.auth.actualizarUsuario(usuario);
        this.terminar(esPublica || esInicio ? '/publicaciones' : null);
      },
      error: () => {
        this.auth.cerrarSesion();
        this.terminar(esPublica ? null : '/login');
      },
    });
  }

  extender() {
    this.extendiendo.set(true);
    this.errorExtender.set('');
    this.auth.refrescar().subscribe({
      next: ({ token }) => {
        this.auth.actualizarToken(token);
        this.modal.set(null);
        this.extendiendo.set(false);
      },
      error: () => {
        this.extendiendo.set(false);
        this.errorExtender.set('No se pudo extender la sesión. Probá de nuevo.');
      },
    });
  }

  cerrarSesion() {
    this.modal.set(null);
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // La sesión venció (por tiempo o porque el servidor respondió 401)
  expirar() {
    if (!this.auth.token) return;
    this.auth.cerrarSesion();
    this.modal.set('vencida');
    this.router.navigate(['/login']);
  }

  aceptarVencida() {
    this.modal.set(null);
  }

  private terminar(destino: string | null) {
    const navegacion = destino
      ? this.router.navigate([destino], { replaceUrl: true })
      : Promise.resolve(true);
    navegacion.finally(() => this.iniciando.set(false));
  }

  private programar(vencimiento: number | null) {
    clearTimeout(this.temporizadorAviso);
    clearTimeout(this.temporizadorVencimiento);
    if (vencimiento === null) return;

    const msRestantes = vencimiento - Date.now();
    if (msRestantes <= 0) {
      this.expirar();
      return;
    }
    if (this.modal() === 'por-vencer') this.modal.set(null);

    this.temporizadorAviso = setTimeout(() => {
      this.restante.set(Math.max(vencimiento - Date.now(), 0));
      this.modal.set('por-vencer');
    }, Math.max(msRestantes - AVISO_ANTES_MS, 0));

    this.temporizadorVencimiento = setTimeout(() => this.expirar(), msRestantes);
  }
}