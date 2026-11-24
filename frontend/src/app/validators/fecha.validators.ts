import { AbstractControl, ValidationErrors } from '@angular/forms';

export function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const fecha = new Date(`${control.value}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return { fechaInvalida: true };
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  return fecha > hoy ? { fechaFutura: true } : null;
}
