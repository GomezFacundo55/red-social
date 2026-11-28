import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SesionService } from '../../services/sesion.service';
import { ModalSesion } from './modal-sesion';

describe('ModalSesion', () => {
  let component: ModalSesion;
  let fixture: ComponentFixture<ModalSesion>;
  let sesion: {
    modal: ReturnType<typeof signal<'aviso' | 'por-vencer' | 'vencida' | null>>;
    textoRestante: ReturnType<typeof signal<string>>;
    errorExtender: ReturnType<typeof signal<string>>;
    extendiendo: ReturnType<typeof signal<boolean>>;
    descartarAviso: ReturnType<typeof vi.fn>;
    extender: ReturnType<typeof vi.fn>;
    cerrarSesion: ReturnType<typeof vi.fn>;
    aceptarVencida: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const modal = signal<'aviso' | 'por-vencer' | 'vencida' | null>(null);
    sesion = {
      modal,
      textoRestante: signal('30 segundos'),
      errorExtender: signal(''),
      extendiendo: signal(false),
      descartarAviso: vi.fn(() => modal.set(null)),
      extender: vi.fn(),
      cerrarSesion: vi.fn(),
      aceptarVencida: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ModalSesion],
      providers: [{ provide: SesionService, useValue: sesion }],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalSesion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows a non-blocking 30-second notice that can be dismissed while browsing', () => {
    sesion.modal.set('aviso');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Quedan 30 segundos');
    expect(fixture.nativeElement.querySelector('.modal-backdrop-glass')).toBeNull();
    const continueButton = fixture.nativeElement.querySelector('.session-notice__dismiss');
    expect(continueButton.textContent).toContain('Seguir usando la red');
    continueButton.click();

    expect(sesion.descartarAviso).toHaveBeenCalledOnce();
  });

  it('emphasizes extending and styles logout as the secondary destructive action', () => {
    sesion.modal.set('por-vencer');
    sesion.textoRestante.set('24 segundos');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Vence en 24 segundos');
    expect(fixture.nativeElement.querySelector('.session-modal__extend').textContent).toContain(
      'Extender sesión',
    );
    expect(fixture.nativeElement.querySelector('.session-modal__extend').classList).toContain(
      'btn-primary',
    );
    expect(fixture.nativeElement.querySelector('.session-modal__logout').classList).toContain(
      'session-modal__logout',
    );
    expect(fixture.nativeElement.querySelector('.session-modal__logout').textContent).toContain(
      'No extender',
    );
  });
});
