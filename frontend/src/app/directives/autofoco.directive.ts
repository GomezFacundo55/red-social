import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({ selector: '[appAutofoco]', standalone: true })
export class AutofocoDirective implements AfterViewInit {
  constructor(private elemento: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    this.elemento.nativeElement.focus();
  }
}
