import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { Orden, Publicacion } from '../../models/publicacion';
import { AuthService } from '../../services/auth.service';
import { PublicacionesService } from '../../services/publicaciones.service';

const POR_PAGINA = 5;

@Component({
  selector: 'app-publicaciones',
  imports: [ReactiveFormsModule, PublicacionCard],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones {
  private servicio = inject(PublicacionesService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  items = signal<Publicacion[]>([]);
  total = signal(0);
  pagina = signal(1);
  orden = signal<Orden>('fecha');
  cargando = signal(false);
  ocupadoId = signal<string | null>(null);

  porEliminar = signal<Publicacion | null>(null);
  modalError = signal<{ titulo: string; mensajes: string[] } | null>(null);

  mostrarFormulario = signal(false);
  enviando = signal(false);
  imagen: File | null = null;
  errorImagen = signal('');

  formPost = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / POR_PAGINA)));

  constructor() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    const offset = (this.pagina() - 1) * POR_PAGINA;
    this.servicio.listar(this.orden(), offset, POR_PAGINA).subscribe({
      next: (res) => {
        const paginas = Math.max(1, Math.ceil(res.total / POR_PAGINA));
        if (this.pagina() > paginas) {
          this.pagina.set(paginas);
          this.cargar();
          return;
        }
        this.items.set(res.items);
        this.total.set(res.total);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.mostrarError('No se pudieron cargar las publicaciones', err);
      },
    });
  }

  cambiarOrden(orden: Orden) {
    if (orden === this.orden()) return;
    this.orden.set(orden);
    this.pagina.set(1);
    this.cargar();
  }

  irAPagina(numero: number) {
    this.pagina.set(numero);
    this.cargar();
  }

  alternarMeGusta(publicacion: Publicacion) {
    const usuarioId = this.auth.usuarioActual()?._id;
    const yaLeGusta = usuarioId ? publicacion.meGusta.includes(usuarioId) : false;
    const peticion = yaLeGusta
      ? this.servicio.quitarMeGusta(publicacion._id)
      : this.servicio.darMeGusta(publicacion._id);

    this.ocupadoId.set(publicacion._id);
    peticion.subscribe({
      next: (actualizada) => {
        this.items.update((lista) => lista.map((p) => (p._id === actualizada._id ? actualizada : p)));
        this.ocupadoId.set(null);
      },
      error: (err) => {
        this.ocupadoId.set(null);
        this.mostrarError('No se pudo actualizar el me gusta', err);
      },
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
    this.servicio.eliminar(publicacion._id).subscribe({
      next: () => {
        this.porEliminar.set(null);
        this.ocupadoId.set(null);
        this.cargar();
      },
      error: (err) => {
        this.porEliminar.set(null);
        this.ocupadoId.set(null);
        this.mostrarError('No se pudo eliminar la publicación', err);
      },
    });
  }

  abrirFormulario() {
    this.formPost.reset({ titulo: '', descripcion: '' });
    this.imagen = null;
    this.errorImagen.set('');
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario() {
    this.mostrarFormulario.set(false);
  }

  onArchivo(event: Event) {
    const archivo = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.imagen = null;
    this.errorImagen.set('');
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      this.errorImagen.set('El archivo debe ser una imagen.');
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      this.errorImagen.set('La imagen no puede superar los 2 MB.');
      return;
    }
    this.imagen = archivo;
  }

  publicar() {
    if (this.formPost.invalid || this.errorImagen()) {
      this.formPost.markAllAsTouched();
      return;
    }
    const datos = new FormData();
    const { titulo, descripcion } = this.formPost.getRawValue();
    datos.append('titulo', titulo ?? '');
    datos.append('descripcion', descripcion ?? '');
    if (this.imagen) datos.append('imagen', this.imagen);

    this.enviando.set(true);
    this.servicio.crear(datos).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mostrarFormulario.set(false);
        this.orden.set('fecha');
        this.pagina.set(1);
        this.cargar();
      },
      error: (err) => {
        this.enviando.set(false);
        this.mostrarError('No se pudo publicar', err);
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