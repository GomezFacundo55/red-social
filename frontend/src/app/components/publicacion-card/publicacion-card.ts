import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { Publicacion } from '../../models/publicacion';
import { AuthService } from '../../services/auth.service';
import { UrlImagenPipe } from '../../pipes/url-imagen.pipe';


@Component({
  selector: 'app-publicacion-card',
  imports: [DatePipe, UrlImagenPipe],
  templateUrl: './publicacion-card.html',
  styleUrl: './publicacion-card.css',
  
})
export class PublicacionCard {
  private auth = inject(AuthService);

  publicacion = input.required<Publicacion>();
  ocupado = input(false);
  soloLectura = input(false);

  alternarMeGusta = output<Publicacion>();
  eliminar = output<Publicacion>();

  leGusta = computed(() => this.publicacion().meGusta.includes(this.auth.usuarioActual()?._id));

  puedeEliminar = computed(() => {
    const usuario = this.auth.usuarioActual();
    return !!usuario && (usuario.perfil === 'administrador' || this.publicacion().autor._id === usuario._id);
  });

}