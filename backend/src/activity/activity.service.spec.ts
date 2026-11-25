import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/schemas/user.schema.js';
import { Actividad } from './activity.schema.js';
import { ActivityService } from './activity.service.js';

describe('ActivityService', () => {
  let service: ActivityService;
  const create = vi.fn();
  const aggregate = vi.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        { provide: getModelToken(Actividad.name), useValue: { create, aggregate } },
        { provide: getModelToken(User.name), useValue: { collection: { name: 'users' } } },
      ],
    }).compile();
    service = module.get<ActivityService>(ActivityService);
    create.mockReset();
    aggregate.mockReset().mockResolvedValue([]);
    create.mockResolvedValue({});
  });

  it('records successful logins and likes', async () => {
    const userId = '507f1f77bcf86cd799439011';
    const publicationId = '507f1f77bcf86cd799439012';

    await service.registrarIngreso(userId);
    await service.registrarMeGusta(userId, publicationId);

    expect(create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ tipo: 'ingreso' }),
    );
    expect(create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ tipo: 'meGusta' }),
    );
  });

  it('records visits from other users', async () => {
    create.mockResolvedValue({});
    await service.registrarVisitaPerfil(
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'visitaPerfil' }),
    );
  });

  it('does not record a visit to the current user profile', async () => {
    await service.registrarVisitaPerfil(
      '507f1f77bcf86cd799439011',
      '507F1F77BCF86CD799439011',
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('fills days without likes with zeroes', async () => {
    aggregate.mockResolvedValue([{ _id: '2026-11-02', cantidad: 2 }]);

    await expect(
      service.meGustaPorFecha(
        new Date('2026-11-01T00:00:00Z'),
        new Date('2026-11-03T23:59:59Z'),
        ['2026-11-01', '2026-11-02', '2026-11-03'],
      ),
    ).resolves.toEqual([
      { fecha: '2026-11-01', cantidad: 0 },
      { fecha: '2026-11-02', cantidad: 2 },
      { fecha: '2026-11-03', cantidad: 0 },
    ]);
  });
});
