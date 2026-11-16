import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalSesion } from './modal-sesion';

describe('ModalSesion', () => {
  let component: ModalSesion;
  let fixture: ComponentFixture<ModalSesion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalSesion],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalSesion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
