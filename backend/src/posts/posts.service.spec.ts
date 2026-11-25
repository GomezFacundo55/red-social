import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Publicacion } from './schemas/publicacion.schema.js';
import { PostsService } from './posts.service.js';
import { UsersService } from '../users/users.service.js';
import { ActivityService } from '../activity/activity.service.js';
import { ConflictException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  const findOne = vi.fn();
  const findOneAndUpdate = vi.fn();
  const populate = vi.fn();
  const registrarMeGusta = vi.fn();

  beforeEach(async () => {
    findOne.mockReset().mockResolvedValue({});
    findOneAndUpdate.mockReset().mockReturnValue({ populate });
    populate.mockReset().mockResolvedValue({ _id: '507f1f77bcf86cd799439012' });
    registrarMeGusta.mockReset().mockResolvedValue({});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getModelToken(Publicacion.name), useValue: { findOne, findOneAndUpdate } },
        { provide: UsersService, useValue: {} },
        { provide: ActivityService, useValue: { registrarMeGusta } },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('records a like only after it is added to the publication', async () => {
    const publicacionId = '507f1f77bcf86cd799439012';
    const usuarioId = '507f1f77bcf86cd799439011';

    await service.darMeGusta(publicacionId, usuarioId);

    expect(registrarMeGusta).toHaveBeenCalledWith(usuarioId, publicacionId);
  });

  it('keeps the like applied when activity recording fails', async () => {
    const usuarioId = '507f1f77bcf86cd799439011';
    const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    registrarMeGusta.mockRejectedValue(new Error('activity storage unavailable'));

    await expect(service.darMeGusta('507f1f77bcf86cd799439012', usuarioId)).resolves.toEqual({
      _id: '507f1f77bcf86cd799439012',
    });

    expect(logError).toHaveBeenCalledWith(
      'No se pudo registrar la actividad del me gusta.',
      expect.stringContaining('activity storage unavailable'),
    );
  });

  it('does not record a duplicate like', async () => {
    findOneAndUpdate.mockReturnValue({ populate: vi.fn().mockResolvedValue(null) });

    await expect(
      service.darMeGusta('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439011'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(registrarMeGusta).not.toHaveBeenCalled();
  });
});
