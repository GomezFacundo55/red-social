import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const jwtService = {
    verifyAsync: vi.fn().mockResolvedValue({
      sub: '0123456789abcdef01234567',
      usuario: 'cuenta',
      perfil: 'administrador',
    }),
  };
  const usersService = {
    buscarPorId: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();
    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('rejects a disabled account even when its JWT is still valid', async () => {
    usersService.buscarPorId.mockResolvedValue({
      usuario: 'cuenta',
      perfil: 'administrador',
      habilitado: false,
    });
    const request = { headers: { authorization: 'Bearer token' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
