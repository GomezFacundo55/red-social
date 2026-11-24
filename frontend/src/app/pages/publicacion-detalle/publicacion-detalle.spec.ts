import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';
import { ComentariosService } from '../../services/comentarios.service';
import { PublicacionesService } from '../../services/publicaciones.service';
import { PublicacionDetalle } from './publicacion-detalle';

describe('PublicacionDetalle', () => {
  let component: PublicacionDetalle;
  let fixture: ComponentFixture<PublicacionDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicacionDetalle],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: PublicacionesService, useValue: { obtener: () => NEVER } },
        { provide: ComentariosService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicacionDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
