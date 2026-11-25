import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  const buscarPorCorreoOUsuario = vi.fn();
  const signAsync = vi.fn();
  const registrarIngreso = vi.fn();
  const id = '507f1f77bcf86cd799439011';
  let usuario: {
    _id: { toString: () => string };
    usuario: string;
    perfil: string;
    password: string;
    habilitado: boolean;
    toObject: () => Record<string, unknown>;
  };
  let passwordHash: string;

  beforeEach(async () => {
    passwordHash = await bcrypt.hash('correcta1', 4);
    usuario = {
      _id: { toString: () => id },
      usuario: 'ana',
      perfil: 'usuario',
      password: passwordHash,
      habilitado: true,
      toObject: () => ({ _id: id, usuario: 'ana', password: passwordHash }),
    };
    buscarPorCorreoOUsuario.mockReset().mockResolvedValue(usuario);
    signAsync.mockReset().mockResolvedValue('token-valido');
    registrarIngreso.mockReset().mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { buscarPorCorreoOUsuario } },
        { provide: JwtService, useValue: { signAsync } },
        { provide: ActivityService, useValue: { registrarIngreso } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('records an enabled user login only after the password is verified', async () => {
    await expect(
      service.login({ usuario: 'ana', password: 'correcta1' }),
    ).resolves.toMatchObject({ token: 'token-valido' });
    expect(registrarIngreso).toHaveBeenCalledWith(id);

    registrarIngreso.mockClear();
    await expect(
      service.login({ usuario: 'ana', password: 'incorrecta1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(registrarIngreso).not.toHaveBeenCalled();
  });

  it('does not count logins for disabled accounts', async () => {
    usuario.habilitado = false;

    await expect(
      service.login({ usuario: 'ana', password: 'correcta1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(registrarIngreso).not.toHaveBeenCalled();
  });
});
