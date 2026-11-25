import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Imagen } from './schemas/imagen.schema.js';
import { User } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  const findOne = vi.fn();
  const select = vi.fn();
  const lean = vi.fn();

  beforeEach(async () => {
    select.mockReturnValue({ lean });
    findOne.mockReturnValue({ select });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: { findOne } },
        { provide: getModelToken(Imagen.name), useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    findOne.mockClear();
    select.mockClear();
    lean.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns public fields for legacy users without an enabled flag', async () => {
    const perfil = {
      _id: '507f1f77bcf86cd799439011',
      nombre: 'Ana',
      apellido: 'Pérez',
      usuario: 'ana',
    };
    lean.mockResolvedValue(perfil);

    await expect(service.obtenerPerfilPublico(perfil._id)).resolves.toEqual(perfil);
    expect(findOne).toHaveBeenCalledWith({ _id: perfil._id, habilitado: { $ne: false } });
    expect(select).toHaveBeenCalledWith(
      'nombre apellido usuario perfil imagenPerfil descripcion createdAt',
    );
  });

  it('does not return a disabled user profile', async () => {
    lean.mockResolvedValue(null);

    await expect(
      service.obtenerPerfilPublico('507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects malformed profile ids without querying the database', async () => {
    await expect(service.obtenerPerfilPublico('no-es-un-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(findOne).not.toHaveBeenCalled();
  });
});
