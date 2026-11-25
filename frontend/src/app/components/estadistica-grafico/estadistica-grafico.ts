import { Component, computed, input } from '@angular/core';
import { NumeroCompactoPipe } from '../../pipes/numero-compacto.pipe';
import { PuntoEstadistico } from '../../services/estadisticas.service';

export type TipoGrafico = 'barras' | 'linea' | 'dona';

const COLORES = ['#1D9BF0', '#F91880', '#00BA7C'];

@Component({
  selector: 'app-estadistica-grafico',
  imports: [NumeroCompactoPipe],
  templateUrl: './estadistica-grafico.html',
  styleUrl: './estadistica-grafico.css',
})
export class EstadisticaGrafico {
  titulo = input.required<string>();
  tipo = input.required<TipoGrafico>();
  puntos = input.required<PuntoEstadistico[]>();

  maximo = computed(() => Math.max(1, ...this.puntos().map((punto) => punto.cantidad)));
  total = computed(() => this.puntos().reduce((suma, punto) => suma + punto.cantidad, 0));

  coordenadasLinea = computed(() =>
    this.puntos()
      .map((punto, indice) => `${this.x(indice)},${this.y(punto.cantidad)}`)
      .join(' '),
  );

  etiquetasLinea = computed(() => {
    const puntos = this.puntos();
    if (puntos.length < 2) return puntos.map((punto, indice) => ({ ...punto, x: this.x(indice) }));
    const salto = Math.max(1, Math.ceil(puntos.length / 6));
    const indices = new Set<number>();
    for (let indice = 0; indice < puntos.length; indice += salto) indices.add(indice);
    indices.add(puntos.length - 1);
    return [...indices].map((indice) => ({ ...puntos[indice], x: this.x(indice) }));
  });

  fondoDona = computed(() => {
    const total = this.total();
    if (!total) return '#2F3336';
    let inicio = 0;
    const segmentos = this.puntos().map((punto, indice) => {
      const fin = inicio + (punto.cantidad / total) * 100;
      const segmento = `${COLORES[indice % COLORES.length]} ${inicio}% ${fin}%`;
      inicio = fin;
      return segmento;
    });
    return `conic-gradient(${segmentos.join(', ')})`;
  });

  anchoBarra(cantidad: number) {
    return (cantidad / this.maximo()) * 100;
  }

  color(indice: number) {
    return COLORES[indice % COLORES.length];
  }

  private x(indice: number) {
    const cantidad = this.puntos().length;
    return cantidad < 2 ? 300 : 32 + (indice / (cantidad - 1)) * 536;
  }

  private y(cantidad: number) {
    return 205 - (cantidad / this.maximo()) * 170;
  }
}
