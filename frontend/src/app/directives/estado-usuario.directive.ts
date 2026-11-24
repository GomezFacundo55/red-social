import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';

@Directive({ selector: '[appEstadoUsuario]', standalone: true })
export class EstadoUsuarioDirective {
  @Input({ alias: 'appEstadoUsuario' })
  set habilitado(valor: boolean) {
    this.renderer.removeClass(this.elemento.nativeElement, 'text-bg-success');
    this.renderer.removeClass(this.elemento.nativeElement, 'text-bg-secondary');
    this.renderer.addClass(
      this.elemento.nativeElement,
      valor ? 'text-bg-success' : 'text-bg-secondary',
    );
    this.renderer.setAttribute(
      this.elemento.nativeElement,
      'aria-label',
      valor ? 'Usuario habilitado' : 'Usuario deshabilitado',
    );
  }

  constructor(
    private elemento: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}
}
