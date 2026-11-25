import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Publicaciones } from './pages/publicaciones/publicaciones';
import { Registro } from './pages/registro/registro';
import { MiPerfil } from './pages/mi-perfil/mi-perfil';
import { authGuard } from './guards/auth.guard';
import { PublicacionDetalle } from './pages/publicacion-detalle/publicacion-detalle';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'publicaciones', component: Publicaciones, canActivate: [authGuard] },
  { path: 'mi-perfil', component: MiPerfil, canActivate: [authGuard] },
  { path: 'usuarios/:id', component: MiPerfil, canActivate: [authGuard] },
  { path: 'publicaciones/:id', component: PublicacionDetalle, canActivate: [authGuard] },
  {
    path: 'dashboard/usuarios',
    loadComponent: () => import('./pages/usuarios-admin/usuarios-admin').then((m) => m.UsuariosAdmin),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'dashboard/estadisticas',
    loadComponent: () => import('./pages/estadisticas/estadisticas').then((m) => m.Estadisticas),
    canActivate: [authGuard, adminGuard],
  },
];
