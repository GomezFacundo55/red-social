import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router,RouterLink } from '@angular/router';
import { passwordFuerte } from '../../validators/password.validators';
import { passwordsCoinciden } from '../../validators/coincidir.validators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';


function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return new Date(control.value) > new Date() ? { fechaFutura: true } : null;
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class Registro {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  imagen: File | null = null;
  errorImagen = '';
  enviando = false;
  modal: { titulo: string; mensajes: string[]; exito: boolean } | null = null;

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
    },
    { validators: passwordsCoinciden }
  );

  get f() { return this.form.controls; }

  onArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.errorImagen = '';
    this.imagen = null;

    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      this.errorImagen = 'El archivo debe ser una imagen.';
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      this.errorImagen = 'La imagen no puede superar los 2 MB.';
      return;
    }
    this.imagen = archivo;
  }

  enviar() {
  if (this.form.invalid || !this.imagen) {
    this.form.markAllAsTouched();
    if (!this.imagen && !this.errorImagen) {
      this.errorImagen = 'Seleccioná una imagen de perfil.';
    }
    return;
  }

  const datos = new FormData();
  Object.entries(this.form.getRawValue()).forEach(([clave, valor]) =>
    datos.append(clave, valor ?? ''),
  );
  datos.append('imagen', this.imagen);

  this.enviando = true;
  this.auth.registro(datos).subscribe({
    next: () => {
      this.enviando = false;
      this.modal = {
        exito: true,
        titulo: '¡Cuenta creada!',
        mensajes: ['Tu registro se completó. Ya podés iniciar sesión.'],
      };
    },
    error: (err: HttpErrorResponse) => {
      this.enviando = false;
      this.modal = {
        exito: false,
        titulo: 'No se pudo completar el registro',
        mensajes: this.mensajesDeError(err),
      };
    },
  });
}

private mensajesDeError(err: HttpErrorResponse): string[] {
  if (err.status === 0) {
    return ['No se pudo conectar con el servidor. Probá de nuevo en unos minutos.'];
  }
  const mensaje = err.error?.message;
  return Array.isArray(mensaje) ? mensaje : [mensaje ?? 'Ocurrió un error inesperado.'];
}

cerrarModal() {
  const exito = this.modal?.exito;
  this.modal = null;
  if (exito) this.router.navigate(['/login']);
}
}