import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Cargando } from './components/cargando/cargando';
import { ModalSesion } from './components/modal-sesion/modal-sesion';
import { Navbar } from './components/navbar/navbar';
import { SesionService } from './services/sesion.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Cargando, ModalSesion],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  sesion = inject(SesionService);

  constructor() {
    this.sesion.iniciar();
  }
}