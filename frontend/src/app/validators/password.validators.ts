import { AbstractControl, ValidationErrors } from '@angular/forms';


/*Un validador es una función que recibe un control 
del formulario y devuelve null si está todo bien, 
o un objeto con los errores si no. Esas claves después 
las usamos en el HTML para elegir el mensaje.*/

export function passwordFuerte(control: AbstractControl): ValidationErrors | null {
  const valor: string = control.value ?? '';
  const errores: ValidationErrors = {};

  if (!/[A-Z]/.test(valor)) errores['sinMayuscula'] = true;
  if (!/\d/.test(valor)) errores['sinNumero'] = true;

  return Object.keys(errores).length ? errores : null;
}