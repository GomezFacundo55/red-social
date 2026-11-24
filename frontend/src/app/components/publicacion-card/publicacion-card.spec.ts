import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { PublicacionCard } from './publicacion-card';

describe('PublicacionCard', () => {
  let component: PublicacionCard;
  let fixture: ComponentFixture<PublicacionCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicacionCard],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: { usuarioActual: () => null } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicacionCard);
    fixture.componentRef.setInput('publicacion', {
      _id: 'p1',
      titulo: 'Título',
      descripcion: 'Descripción',
      autor: {
        _id: 'u1',
        nombre: 'Nombre',
        apellido: 'Apellido',
        usuario: 'usuario',
        imagenPerfil: '',
      },
      meGusta: [],
      cantidadMeGusta: 0,
      cantidadComentarios: 0,
      createdAt: new Date().toISOString(),
    });
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
