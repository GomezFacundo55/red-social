import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Registro } from './registro';

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
    expect(imageInput.compareDocumentPosition(submitButtons[0]) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
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
});
