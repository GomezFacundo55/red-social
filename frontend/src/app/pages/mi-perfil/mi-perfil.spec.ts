import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Publicacion } from '../../models/publicacion';
import { AuthService } from '../../services/auth.service';
import { PublicacionesService } from '../../services/publicaciones.service';
import { UsuariosService } from '../../services/usuarios.service';
import { MiPerfil } from './mi-perfil';

describe('MiPerfil', () => {
  let component: MiPerfil;
  let fixture: ComponentFixture<MiPerfil>;
  const perfil = {
    _id: '507f1f77bcf86cd799439011',
    nombre: 'Ana',
    apellido: 'Pérez',
    usuario: 'ana',
    perfil: 'usuario' as const,
    imagenPerfil: '',
    descripcion: 'Hola',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const items = Array.from({ length: 3 }, (_, indice): Publicacion => ({
    _id: `507f1f77bcf86cd79943901${indice + 2}`,
    titulo: `Publicación ${indice + 1}`,
    descripcion: 'Descripción',
    autor: {
      _id: perfil._id,
      nombre: perfil.nombre,
      apellido: perfil.apellido,
      usuario: perfil.usuario,
      imagenPerfil: '',
    },
    meGusta: [],
    cantidadMeGusta: 0,
    cantidadComentarios: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  }));
  const listar = vi.fn().mockReturnValue(of({ items, total: 3, offset: 0, limit: 3 }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiPerfil],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: perfil._id })) } },
        { provide: AuthService, useValue: { usuarioActual: () => ({ _id: 'viewer-id' }) } },
        { provide: UsuariosService, useValue: { obtenerPerfil: () => of(perfil) } },
        { provide: PublicacionesService, useValue: { listar, eliminar: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MiPerfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the selected user and only their three latest publications', () => {
    expect(component.usuario()?._id).toBe(perfil._id);
    expect(component.publicaciones()).toHaveLength(3);
    expect(listar).toHaveBeenCalledWith('fecha', 0, 3, perfil._id);
  });
});
