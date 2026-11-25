import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { UrlImagenPipe } from '../../pipes/url-imagen.pipe';
import { Orden, Publicacion } from '../../models/publicacion';
import { AuthService } from '../../services/auth.service';
import { PublicacionesService } from '../../services/publicaciones.service';

const POR_PAGINA = 5;

@Component({
  selector: 'app-publicaciones',
  imports: [ReactiveFormsModule, PublicacionCard, RouterLink, UrlImagenPipe],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones implements AfterViewInit, OnDestroy {
  private servicio = inject(PublicacionesService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  items = signal<Publicacion[]>([]);
  total = signal(0);
  orden = signal<Orden>('fecha');
  cargando = signal(false);
  hayMas = signal(true);
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

  @ViewChild('sentinel') private sentinel?: ElementRef<HTMLElement>;

  private observer: IntersectionObserver | null = null;
  private frameId: number | null = null;
  private cargaVersion = 0;

  constructor() {
    this.cargarMas();
  }

  ngAfterViewInit() {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) this.cargarMas();
      },
      { rootMargin: '500px 0px' },
    );
    if (this.sentinel) this.observer.observe(this.sentinel.nativeElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
  }

  cargarMas() {
    if (this.cargando() || !this.hayMas()) return;

    const version = this.cargaVersion;
    const offset = this.items().length;
    this.cargando.set(true);
    this.servicio.listar(this.orden(), offset, POR_PAGINA).subscribe({
      next: (res) => {
        if (version !== this.cargaVersion) return;
        const actuales = this.items();
        const idsActuales = new Set(actuales.map((item) => item._id));
        const nuevos = res.items.filter((item) => !idsActuales.has(item._id));
        this.items.set([...actuales, ...nuevos]);
        this.total.set(res.total);
        this.hayMas.set(nuevos.length > 0 && this.items().length < res.total);
        this.cargando.set(false);
        this.cargarSiSentinelVisible();
      },
      error: (err) => {
        if (version !== this.cargaVersion) return;
        this.cargando.set(false);
        this.mostrarError('No se pudieron cargar las publicaciones', err);
      },
    });
  }

  cambiarOrden(orden: Orden) {
    if (orden === this.orden()) return;
    this.orden.set(orden);
    this.reiniciarFeed();
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
        if (this.cargando()) {
          this.reiniciarFeed();
          return;
        }
        this.items.update((items) => items.filter((item) => item._id !== publicacion._id));
        this.total.update((total) => Math.max(0, total - 1));
        this.hayMas.set(this.items().length < this.total());
        if (this.hayMas()) this.cargarMas();
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
        this.reiniciarFeed();
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

  private reiniciarFeed() {
    this.cargaVersion++;
    this.items.set([]);
    this.total.set(0);
    this.hayMas.set(true);
    this.cargando.set(false);
    this.cargarMas();
  }

  private cargarSiSentinelVisible() {
    const sentinel = this.sentinel?.nativeElement;
    if (!this.observer || !sentinel || !this.hayMas() || this.cargando() || this.frameId !== null) {
      return;
    }

    this.frameId = requestAnimationFrame(() => {
      this.frameId = null;
      if (!this.hayMas() || this.cargando()) return;
      if (sentinel.getBoundingClientRect().top <= window.innerHeight + 500) {
        this.cargarMas();
      }
    });
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