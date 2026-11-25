import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PublicacionesService } from '../../services/publicaciones.service';
import { Publicacion } from '../../models/publicacion';
import { Publicaciones } from './publicaciones';

describe('Publicaciones', () => {
  let component: Publicaciones;
  let fixture: ComponentFixture<Publicaciones>;
  let listar: ReturnType<typeof vi.fn>;

  const publicacion = (id: string): Publicacion => ({
    _id: id,
    titulo: `Título ${id}`,
    descripcion: 'Descripción',
    autor: {
      _id: '507f1f77bcf86cd799439099',
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

  beforeEach(async () => {
    listar = vi.fn().mockReturnValue(of({ items: [], total: 0, offset: 0, limit: 5 }));
    await TestBed.configureTestingModule({
      imports: [Publicaciones],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: { usuarioActual: () => null } },
        { provide: PublicacionesService, useValue: { listar } },
      ],
    }).compileComponents();

  });

  it('should create', async () => {
    fixture = TestBed.createComponent(Publicaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('appends the next batch without replacing loaded publications', async () => {
    const primeros = Array.from({ length: 5 }, (_, indice) => publicacion(`p${indice + 1}`));
    listar
      .mockReturnValueOnce(of({ items: primeros, total: 6, offset: 0, limit: 5 }))
      .mockReturnValueOnce(of({ items: [publicacion('p6')], total: 6, offset: 5, limit: 5 }));
    fixture = TestBed.createComponent(Publicaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();

    component.cargarMas();
    await fixture.whenStable();

    expect(listar).toHaveBeenNthCalledWith(2, 'fecha', 5, 5);
    expect(component.items().map((item) => item._id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
    expect(component.hayMas()).toBe(false);
  });

  it('loads the next batch when the infinite-scroll sentinel enters view', async () => {
    const primeros = Array.from({ length: 5 }, (_, indice) => publicacion(`p${indice + 1}`));
    let callback: IntersectionObserverCallback | undefined;
    let observer: FakeIntersectionObserver | undefined;
    class FakeIntersectionObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);

      constructor(observerCallback: IntersectionObserverCallback) {
        callback = observerCallback;
        observer = this;
      }
    }
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    listar
      .mockReturnValueOnce(of({ items: primeros, total: 6, offset: 0, limit: 5 }))
      .mockReturnValueOnce(of({ items: [publicacion('p6')], total: 6, offset: 5, limit: 5 }));

    try {
      fixture = TestBed.createComponent(Publicaciones);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();

      callback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver,
      );
      await fixture.whenStable();

      expect(observer?.observe).toHaveBeenCalled();
      expect(component.items().map((item) => item._id)).toHaveLength(6);
      expect(listar).toHaveBeenNthCalledWith(2, 'fecha', 5, 5);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
