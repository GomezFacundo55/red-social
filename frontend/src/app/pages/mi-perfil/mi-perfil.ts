import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { PublicacionCard } from '../../components/publicacion-card/publicacion-card';
import { Publicacion } from '../../models/publicacion';
import { AuthService } from '../../services/auth.service';
import { PublicacionesService } from '../../services/publicaciones.service';
import { UrlImagenPipe } from '../../pipes/url-imagen.pipe';

@Component({
  selector: 'app-mi-perfil',
  imports: [DatePipe, PublicacionCard,UrlImagenPipe],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil {
  private auth = inject(AuthService);
  private servicio = inject(PublicacionesService);

  usuario = this.auth.usuarioActual;
  publicaciones = signal<Publicacion[]>([]);
  cargando = signal(true);
  error = signal('');

  constructor() {
    const id = this.usuario()?._id;
    if (!id) {
      this.cargando.set(false);
      return;
    }
    this.servicio.listar('fecha', 0, 3, id).subscribe({
      next: (res) => {
        this.publicaciones.set(res.items);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus publicaciones.');
        this.cargando.set(false);
      },
    });
  }
}