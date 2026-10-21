import { AbstractControl, ValidationErrors } from '@angular/forms';

export function passwordsCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value;
  const repetir = grupo.get('repetirPassword')?.value;
  return password === repetir ? null : { noCoinciden: true };
}