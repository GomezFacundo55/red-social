import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsuarioAdmin } from '../../models/usuario-admin';
import { InicialesPipe } from '../../pipes/iniciales.pipe';
import { UrlImagenPipe } from '../../pipes/url-imagen.pipe';
import { AuthService } from '../../services/auth.service';
import { UsuariosAdminService } from '../../services/usuarios-admin.service';
import { AutofocoDirective } from '../../directives/autofoco.directive';
import { EstadoUsuarioDirective } from '../../directives/estado-usuario.directive';
import { fechaNoFutura } from '../../validators/fecha.validators';
import { passwordsCoinciden } from '../../validators/coincidir.validators';
import { passwordFuerte } from '../../validators/password.validators';

const POR_PAGINA = 10;

@Component({
  selector: 'app-usuarios-admin',
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    InicialesPipe,
    UrlImagenPipe,
    AutofocoDirective,
    EstadoUsuarioDirective,
  ],
  templateUrl: './usuarios-admin.html',
  styleUrl: './usuarios-admin.css',
})
export class UsuariosAdmin {
  private fb = inject(FormBuilder);
  private servicio = inject(UsuariosAdminService);
  auth = inject(AuthService);

  usuarios = signal<UsuarioAdmin[]>([]);
  total = signal(0);
  pagina = signal(1);
  cargando = signal(false);
  mostrarFormulario = signal(false);
  enviando = signal(false);
  ocupadoId = signal<string | null>(null);
  imagen: File | null = null;
  errorImagen = signal('');
  error = signal('');
  exito = signal('');

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / POR_PAGINA)));

  form = this.fb.group(
    {
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8), passwordFuerte]],
      repetirPassword: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required, fechaNoFutura]],
      descripcion: ['', [Validators.required, Validators.maxLength(200)]],
      perfil: ['usuario', [Validators.required]],
    },
    { validators: passwordsCoinciden },
  );

  get f() {
    return this.form.controls;
  }

  constructor() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.servicio.listar((this.pagina() - 1) * POR_PAGINA, POR_PAGINA).subscribe({
      next: (respuesta) => {
        this.usuarios.set(respuesta.items);
        this.total.set(respuesta.total);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(this.mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  irAPagina(pagina: number) {
    this.pagina.set(pagina);
    this.cargar();
  }

  abrirFormulario() {
    this.form.reset({
      nombre: '',
      apellido: '',
      correo: '',
      usuario: '',
      password: '',
      repetirPassword: '',
      fechaNacimiento: '',
      descripcion: '',
      perfil: 'usuario',
    });
    this.imagen = null;
    this.errorImagen.set('');
    this.error.set('');
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

  crear() {
    this.error.set('');
    this.exito.set('');
    if (this.form.invalid || !this.imagen || this.errorImagen()) {
      this.form.markAllAsTouched();
      if (!this.imagen && !this.errorImagen()) {
        this.errorImagen.set('Seleccioná una imagen de perfil.');
      }
      return;
    }

    const datos = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([clave, valor]) =>
      datos.append(clave, valor ?? ''),
    );
    datos.append('imagen', this.imagen);
    this.enviando.set(true);

    this.servicio.crear(datos).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mostrarFormulario.set(false);
        this.exito.set('El usuario se creó correctamente.');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  cambiarEstado(usuario: UsuarioAdmin) {
    if (usuario._id === this.auth.usuarioActual()?._id && usuario.habilitado) {
      this.error.set('No podés deshabilitar tu propia cuenta.');
      return;
    }
    this.error.set('');
    this.exito.set('');
    this.ocupadoId.set(usuario._id);
    const peticion = usuario.habilitado
      ? this.servicio.deshabilitar(usuario._id)
      : this.servicio.habilitar(usuario._id);
    peticion.subscribe({
      next: (actualizado) => {
        this.usuarios.update((lista) =>
          lista.map((item) => (item._id === actualizado._id ? actualizado : item)),
        );
        this.ocupadoId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.ocupadoId.set(null);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  private mensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) return 'No se pudo conectar con el servidor.';
    const mensaje = err.error?.message;
    return Array.isArray(mensaje) ? mensaje.join(' ') : mensaje ?? 'Ocurrió un error inesperado.';
  }
}
