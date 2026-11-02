import { Component,inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router,RouterLink } from '@angular/router';
import { passwordFuerte } from '../../validators/password.validators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

    private fb = inject(FormBuilder);
    private auth = inject(AuthService);
    private router = inject(Router);
    
    enviando = false;
    modal: { titulo: string; mensajes: string[] } | null = null;

    form = this.fb.group({
    usuario: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8), passwordFuerte]],
  });

  

  get usuario() { return this.form.controls.usuario; }
  get password() { return this.form.controls.password; }

  enviar() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.enviando = true;
  this.auth
    .login({ usuario: this.usuario.value ?? '', password: this.password.value ?? '' })
    .subscribe({
      next: (res) => {
        this.enviando = false;
        this.auth.guardarSesion(res.token, res.usuario);
        this.router.navigate(['/publicaciones']);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando = false;
        this.modal = {
          titulo: 'No se pudo iniciar sesión',
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
  this.modal = null;
}
}