import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { PublicacionCard } from './publicacion-card';

describe('PublicacionCard', () => {
  let component: PublicacionCard;
  let fixture: ComponentFixture<PublicacionCard>;
  let usuarioActual: ReturnType<typeof signal<{ _id: string; perfil: string } | null>>;

  beforeEach(async () => {
    usuarioActual = signal(null);
    await TestBed.configureTestingModule({
      imports: [PublicacionCard],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: { usuarioActual } },
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

  it('keeps administrator deletion available in read-only profile cards', () => {
    usuarioActual.set({ _id: 'admin1', perfil: 'administrador' });
    fixture.componentRef.setInput('soloLectura', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.publication-delete')).toBeTruthy();
  });
});
