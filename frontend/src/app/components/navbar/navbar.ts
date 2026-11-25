import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SoloAdminDirective } from '../../directives/solo-admin.directive';
import { UrlImagenPipe } from '../../pipes/url-imagen.pipe';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, SoloAdminDirective, UrlImagenPipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  auth = inject(AuthService);
  private router = inject(Router);

  cerrarSesion() {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}