import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { Comentario, Publicacion } from '../../models/publicacion';
import { UrlImagenPipe } from '../../pipes/url-imagen.pipe';
import { AuthService } from '../../services/auth.service';
import { ComentariosService } from '../../services/comentarios.service';
import { PublicacionesService } from '../../services/publicaciones.service';

const POR_CARGA = 5;

@Component({
  selector: 'app-publicacion-detalle',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, PublicacionCard, UrlImagenPipe],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.css',
})
export class PublicacionDetalle {
  private ruta = inject(ActivatedRoute);
  private publicaciones = inject(PublicacionesService);
  private comentariosApi = inject(ComentariosService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  private id = this.ruta.snapshot.paramMap.get('id') ?? '';

  publicacion = signal<Publicacion | null>(null);
  cargando = signal(true);
  errorCarga = signal('');
  ocupado = signal(false);

  comentarios = signal<Comentario[]>([]);
  totalComentarios = signal(0);
  cargandoComentarios = signal(false);
  enviando = signal(false);
  editandoId = signal<string | null>(null);
  guardandoEdicion = signal(false);
  modalError = signal<{ titulo: string; mensajes: string[] } | null>(null);

  hayMas = computed(() => this.comentarios().length < this.totalComentarios());

  formComentario = this.fb.group({
    texto: ['', [Validators.required, Validators.maxLength(500), Validators.pattern(/\S/)]],
  });
  formEdicion = this.fb.group({
    texto: ['', [Validators.required, Validators.maxLength(500), Validators.pattern(/\S/)]],
  });

  constructor() {
    this.publicaciones.obtener(this.id).subscribe({
      next: (publicacion) => {
        this.publicacion.set(publicacion);
        this.cargando.set(false);
        this.cargarComentarios();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        this.errorCarga.set(
          err.status === 400 || err.status === 404
            ? 'La publicación no existe o fue eliminada.'
            : 'No se pudo cargar la publicación.',
        );
      },
    });
  }

  esMio(comentario: Comentario) {
    return comentario.autor._id === this.auth.usuarioActual()?._id;
  }

  // Trae los siguientes comentarios, sin quitar los que ya se muestran
  cargarComentarios() {
    this.cargandoComentarios.set(true);
    const offset = this.comentarios().length;
    this.comentariosApi.listar(this.id, offset, POR_CARGA).subscribe({
      next: (pagina) => {
        const existentes = new Set(this.comentarios().map((c) => c._id));
        const nuevos = pagina.items.filter((c) => !existentes.has(c._id));
        this.comentarios.update((lista) => [...lista, ...nuevos]);
        this.totalComentarios.set(pagina.total);
        this.cargandoComentarios.set(false);
      },
      error: (err) => {
        this.cargandoComentarios.set(false);
        this.mostrarError('No se pudieron cargar los comentarios', err);
      },
    });
  }

  alternarMeGusta(publicacion: Publicacion) {
    const yaLeGusta = publicacion.meGusta.includes(this.auth.usuarioActual()?._id);
    const peticion = yaLeGusta
      ? this.publicaciones.quitarMeGusta(publicacion._id)
      : this.publicaciones.darMeGusta(publicacion._id);

    this.ocupado.set(true);
    peticion.subscribe({
      next: (actualizada) => {
        this.publicacion.set(actualizada);
        this.ocupado.set(false);
      },
      error: (err) => {
        this.ocupado.set(false);
        this.mostrarError('No se pudo actualizar el me gusta', err);
      },
    });
  }

  comentar() {
    if (this.formComentario.invalid) {
      this.formComentario.markAllAsTouched();
      return;
    }
    const texto = this.formComentario.getRawValue().texto ?? '';
    this.enviando.set(true);
    this.comentariosApi.crear(this.id, texto).subscribe({
      next: (nuevo) => {
        this.comentarios.update((lista) => [nuevo, ...lista]);
        this.totalComentarios.update((total) => total + 1);
        this.publicacion.update((p) => (p ? { ...p, cantidadComentarios: p.cantidadComentarios + 1 } : p));
        this.formComentario.reset({ texto: '' });
        this.enviando.set(false);
      },
      error: (err) => {
        this.enviando.set(false);
        this.mostrarError('No se pudo publicar el comentario', err);
      },
    });
  }

  empezarEdicion(comentario: Comentario) {
    this.formEdicion.reset({ texto: comentario.texto });
    this.editandoId.set(comentario._id);
  }

  cancelarEdicion() {
    this.editandoId.set(null);
  }

  guardarEdicion(comentario: Comentario) {
    if (this.formEdicion.invalid) {
      this.formEdicion.markAllAsTouched();
      return;
    }
    const texto = this.formEdicion.getRawValue().texto ?? '';
    this.guardandoEdicion.set(true);
    this.comentariosApi.modificar(this.id, comentario._id, texto).subscribe({
      next: (actualizado) => {
        this.comentarios.update((lista) => lista.map((c) => (c._id === actualizado._id ? actualizado : c)));
        this.editandoId.set(null);
        this.guardandoEdicion.set(false);
      },
      error: (err) => {
        this.guardandoEdicion.set(false);
        this.mostrarError('No se pudo guardar el cambio', err);
      },
    });
  }

  cerrarError() {
    this.modalError.set(null);
  }

  private mostrarError(titulo: string, err: HttpErrorResponse) {
    let mensajes = ['Ocurrió un error inesperado.'];
    if (err.status === 0) {
      mensajes = ['No se pudo conectar con el servidor. Probá de nuevo en unos minutos.'];
    } else if (Array.isArray(err.error?.message)) {
      mensajes = err.error.message;
    } else if (err.error?.message) {
      mensajes = [err.error.message];
    }
    this.modalError.set({ titulo, mensajes });
  }
}