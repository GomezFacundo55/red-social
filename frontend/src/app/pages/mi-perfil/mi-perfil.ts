import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, distinctUntilChanged, map, of, switchMap, tap, throwError } from 'rxjs';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { Publicacion } from '../../models/publicacion';
import { UsuarioPerfil } from '../../models/usuario-perfil';
import { AuthService } from '../../services/auth.service';
import { PublicacionesService } from '../../services/publicaciones.service';
import { UsuariosService } from '../../services/usuarios.service';
import { UrlImagenPipe } from '../../pipes/url-imagen.pipe';

type ResultadoPerfil =
  | { perfil: UsuarioPerfil; publicaciones: Publicacion[] }
  | { error: string };

@Component({
  selector: 'app-mi-perfil',
  imports: [DatePipe, PublicacionCard, UrlImagenPipe],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private publicacionesService = inject(PublicacionesService);
  private usuariosService = inject(UsuariosService);

  usuario = signal<UsuarioPerfil | null>(null);
  esPropio = computed(() => this.usuario()?._id === this.auth.usuarioActual()?._id);
  publicaciones = signal<Publicacion[]>([]);
  cargando = signal(true);
  error = signal('');
  ocupadoId = signal<string | null>(null);
  porEliminar = signal<Publicacion | null>(null);
  modalError = signal('');

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        tap(() => {
          this.usuario.set(null);
          this.publicaciones.set([]);
          this.error.set('');
          this.cargando.set(true);
        }),
        switchMap((id) => {
          const usuarioActual = this.auth.usuarioActual();
          const perfil$ =
            id && id !== usuarioActual?._id
              ? this.usuariosService.obtenerPerfil(id)
              : usuarioActual
                ? of(usuarioActual)
                : throwError(() => new Error('No se pudo identificar al usuario.'));

          return perfil$.pipe(
            tap((perfil) => this.usuario.set(perfil)),
            switchMap((perfil) =>
              this.publicacionesService
                .listar('fecha', 0, 3, perfil._id)
                .pipe(map((pagina): ResultadoPerfil => ({ perfil, publicaciones: pagina.items }))),
            ),
            catchError((err: unknown) => of({ error: this.mensajeError(err) })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => {
        if ('error' in resultado) {
          this.error.set(resultado.error);
        } else {
          this.usuario.set(resultado.perfil);
          this.publicaciones.set(resultado.publicaciones);
        }
        this.cargando.set(false);
      });
  }

  pedirEliminar(publicacion: Publicacion) {
    this.porEliminar.set(publicacion);
  }

  cancelarEliminar() {
    this.porEliminar.set(null);
  }

  confirmarEliminar() {
    const publicacion = this.porEliminar();
    if (!publicacion) return;

    this.ocupadoId.set(publicacion._id);
    this.publicacionesService.eliminar(publicacion._id).subscribe({
      next: () => {
        this.publicaciones.update((actuales) =>
          actuales.filter((actual) => actual._id !== publicacion._id),
        );
        this.porEliminar.set(null);
        this.ocupadoId.set(null);
      },
      error: (err: unknown) => {
        this.porEliminar.set(null);
        this.ocupadoId.set(null);
        this.modalError.set(this.mensajeError(err));
      },
    });
  }

  cerrarError() {
    this.modalError.set('');
  }

  private mensajeError(err: unknown) {
    if (err instanceof HttpErrorResponse) {
      const mensaje = err.error?.message;
      if (err.status === 0) return 'No se pudo conectar con el servidor.';
      if (Array.isArray(mensaje)) return mensaje.join(' ');
      if (typeof mensaje === 'string') return mensaje;
    }
    return err instanceof Error
      ? err.message
      : 'No se pudo cargar el perfil o sus publicaciones.';
  }
}
