import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { Registro } from './registro';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

describe('Registro', () => {
  let component: Registro;
  let fixture: ComponentFixture<Registro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Registro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows one submit button after the required profile image input', () => {
    const submitButtons = fixture.nativeElement.querySelectorAll('button[type="submit"]');
    const imageInput = fixture.nativeElement.querySelector('#registro-imagen');

    expect(submitButtons).toHaveLength(1);
    expect(
      imageInput.compareDocumentPosition(submitButtons[0]) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('accepts only image formats supported by the backend', () => {
    const event = new Event('change');
    const input = document.createElement('input');
    const file = new File(['image'], 'avatar.svg', { type: 'image/svg+xml' });
    Object.defineProperty(input, 'files', { value: [file] });
    Object.defineProperty(event, 'target', { value: input });

    component.onArchivo(event);

    expect(component.imagen).toBeNull();
    expect(component.errorImagen).toBe('La imagen debe ser JPG, PNG, WEBP o GIF.');
  });

  it('shows email feedback while typing and clears it when the address becomes valid', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#registro-correo');

    input.value = 'correo-invalido';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(input.classList).toContain('is-invalid');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#registro-correo-error').textContent).toContain(
      'Ingresá un correo válido',
    );

    input.value = 'persona@ejemplo.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(input.classList).not.toContain('is-invalid');
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('navigates to publications immediately after saving the new session', () => {
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    const usuario = {
      _id: 'user-id',
      nombre: 'Ada',
      apellido: 'Lovelace',
      correo: 'ada@example.com',
      usuario: 'ada',
      perfil: 'usuario' as const,
      habilitado: true,
      imagenPerfil: '/users/imagen/image-id',
      descripcion: 'Hola',
      fechaNacimiento: '2000-01-01',
      createdAt: '2026-01-01',
    };
    const guardarSesion = vi.spyOn(auth, 'guardarSesion');
    const registro = vi.spyOn(auth, 'registro').mockReturnValue(of({ token: 'token', usuario }));
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.form.setValue({
      nombre: 'Ada',
      apellido: 'Lovelace',
      correo: 'ada@example.com',
      usuario: 'ada',
      password: 'Abcdefg1',
      repetirPassword: 'Abcdefg1',
      fechaNacimiento: '2000-01-01',
      descripcion: 'Hola',
    });
    component.imagen = new File(['image'], 'avatar.png', { type: 'image/png' });

    component.enviar();

    expect(registro).toHaveBeenCalledOnce();
    expect(guardarSesion).toHaveBeenCalledWith('token', usuario);
    expect(navegar).toHaveBeenCalledWith(['/publicaciones']);
    expect(component.modal).toBeNull();
  });
});
