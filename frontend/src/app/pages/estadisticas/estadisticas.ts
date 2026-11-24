import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { EstadisticaGrafico } from '../../components/estadistica-grafico/estadistica-grafico';
import { PuntoEstadistico } from '../../services/estadisticas.service';
import { EstadisticasService } from '../../services/estadisticas.service';

function fechaIso(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-estadisticas',
  imports: [ReactiveFormsModule, EstadisticaGrafico],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css',
})
export class Estadisticas {
  private fb = inject(FormBuilder);
  private servicio = inject(EstadisticasService);

  cargando = signal(false);
  error = signal('');
  publicaciones = signal<PuntoEstadistico[]>([]);
  comentariosPorDia = signal<PuntoEstadistico[]>([]);
  comentariosPorPublicacion = signal<PuntoEstadistico[]>([]);

  rango = this.fb.group({
    desde: [this.fechaInicial(), [Validators.required]],
    hasta: [fechaIso(new Date()), [Validators.required]],
  });

  constructor() {
    this.consultar();
  }

  consultar() {
    this.error.set('');
    if (this.rango.invalid) {
      this.rango.markAllAsTouched();
      return;
    }
    const { desde, hasta } = this.rango.getRawValue();
    if (!desde || !hasta || desde > hasta) {
      this.error.set('La fecha inicial debe ser anterior o igual a la fecha final.');
      return;
    }
    this.cargando.set(true);
    forkJoin({
      publicaciones: this.servicio.publicacionesPorUsuario(desde, hasta),
      comentarios: this.servicio.comentariosPorFecha(desde, hasta),
      publicacionesComentarios: this.servicio.comentariosPorPublicacion(desde, hasta),
    }).subscribe({
      next: (datos) => {
        this.publicaciones.set(
          datos.publicaciones.map((item) => ({
            etiqueta: `${item.etiqueta} (@${item.usuario})`,
            cantidad: item.cantidad,
          })),
        );
        this.comentariosPorDia.set(
          datos.comentarios.map((item) => ({
            etiqueta: item.fecha.slice(5),
            cantidad: item.cantidad,
          })),
        );
        this.comentariosPorPublicacion.set(
          datos.publicacionesComentarios.map((item) => ({
            etiqueta: item.titulo,
            cantidad: item.cantidad,
          })),
        );
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const mensaje = err.error?.message;
        this.error.set(
          err.status === 0
            ? 'No se pudo conectar con el servidor.'
            : Array.isArray(mensaje)
              ? mensaje.join(' ')
              : mensaje ?? 'No se pudieron cargar las estadísticas.',
        );
        this.cargando.set(false);
      },
    });
  }

  private fechaInicial() {
    const fecha = new Date();
    fecha.setUTCDate(fecha.getUTCDate() - 29);
    return fechaIso(fecha);
  }
}
