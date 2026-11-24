import { Directive, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({ selector: '[appSoloAdmin]', standalone: true })
export class SoloAdminDirective {
  private auth = inject(AuthService);
  private template = inject(TemplateRef<unknown>);
  private container = inject(ViewContainerRef);
  private visible = false;

  constructor() {
    effect(() => {
      const esAdmin = this.auth.usuarioActual()?.perfil === 'administrador';
      if (esAdmin === this.visible) return;
      this.visible = esAdmin;
      this.container.clear();
      if (esAdmin) this.container.createEmbeddedView(this.template);
    });
  }
}
