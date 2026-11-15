import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const apiUrl = environment.apiUrl.replace(/\/+$/, '');
  const token = auth.token;

  // El token se agrega solo a las peticiones que van a nuestro backend
  const peticion =
    token && req.url.startsWith(apiUrl)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      // Si el token venció o es inválido, se cierra la sesión
      if (err.status === 401 && token && !req.url.includes('/auth/')) {
        auth.cerrarSesion();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};