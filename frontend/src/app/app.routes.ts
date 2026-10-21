import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Publicaciones } from './pages/publicaciones/publicaciones';
import { Registro } from './pages/registro/registro';
import { MiPerfil } from './pages/mi-perfil/mi-perfil';

export const routes: Routes = [
    {path : '',redirectTo:'login',pathMatch:'full'},
    {path : 'login',component: Login},
    {path : 'registro',component: Registro},
    {path : 'publicaciones',component: Publicaciones},
    {path : 'mi-perfil',component:MiPerfil},
];
