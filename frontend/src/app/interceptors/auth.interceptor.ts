import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { SesionService } from '../services/sesion.service';

const RUTAS_DE_ACCESO = ['/auth/login', '/auth/registro', '/auth/autorizar'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const sesion = inject(SesionService);
  const apiUrl = environment.apiUrl.replace(/\/+$/, '');
  const token = auth.token;

  const peticion =
    token && req.url.startsWith(apiUrl)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  const esDeAcceso = RUTAS_DE_ACCESO.some((ruta) => req.url.endsWith(ruta));

  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && token && !esDeAcceso) {
        sesion.expirar();
      }
      return throwError(() => err);
    }),
  );
};