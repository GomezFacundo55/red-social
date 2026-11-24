import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Comentario } from './schemas/comentario.schema.js';
import { Publicacion } from './schemas/publicacion.schema.js';
import { StatsService } from './stats.service.js';
import { User } from '../users/schemas/user.schema.js';

describe('StatsService', () => {
  let service: StatsService;
  const aggregate = vi.fn().mockResolvedValue([{ _id: '2026-11-01', cantidad: 2 }]);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: getModelToken(Publicacion.name),
          useValue: { aggregate, collection: { name: 'publicacions' } },
        },
        {
          provide: getModelToken(Comentario.name),
          useValue: { aggregate, collection: { name: 'comentarios' } },
        },
        {
          provide: getModelToken(User.name),
          useValue: { collection: { name: 'users' } },
        },
      ],
    }).compile();
    service = module.get<StatsService>(StatsService);
    aggregate.mockClear();
  });

  it('rejects invalid calendar dates with a client error', async () => {
    await expect(
      service.comentariosPorFecha('2026-02-30', '2026-03-02'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(aggregate).not.toHaveBeenCalled();
  });

  it('fills days with zero comments so the time series has no gaps', async () => {
    await expect(
      service.comentariosPorFecha('2026-11-01', '2026-11-03'),
    ).resolves.toEqual([
      { fecha: '2026-11-01', cantidad: 2 },
      { fecha: '2026-11-02', cantidad: 0 },
      { fecha: '2026-11-03', cantidad: 0 },
    ]);
  });
});
