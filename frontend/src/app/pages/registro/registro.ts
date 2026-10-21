import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { passwordFuerte } from '../../validators/password.validators';
import { passwordsCoinciden } from '../../validators/coincidir.validators';

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

  imagen: File | null = null;
  errorImagen = '';

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
    console.log(this.form.value, this.imagen); // después: envío al backend
  }
}