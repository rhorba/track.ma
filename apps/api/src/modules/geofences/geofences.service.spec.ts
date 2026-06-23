import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GeofencesService } from './geofences.service';
import { Geofence } from '../../entities/geofence.entity';

const makeRepo = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn((d) => d),
  save: jest.fn((d) => Promise.resolve({ id: 'gf-1', ...d })),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
});

const validPolygon = [
  { lat: 10, lng: 10 },
  { lat: 10, lng: 20 },
  { lat: 20, lng: 20 },
];

describe('GeofencesService', () => {
  let service: GeofencesService;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    repo = makeRepo();
    const module = await Test.createTestingModule({
      providers: [
        GeofencesService,
        { provide: getRepositoryToken(Geofence), useValue: repo },
      ],
    }).compile();
    service = module.get(GeofencesService);
  });

  it('lists geofences for an org', async () => {
    repo.find.mockResolvedValue([{ id: 'gf-1', name: 'Zone A' }]);
    const result = await service.list('org-1');
    expect(result).toHaveLength(1);
    expect(repo.find).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', isActive: true },
    });
  });

  it('creates a geofence with valid polygon', async () => {
    const result = await service.create({
      name: 'Test',
      polygon: validPolygon,
      organizationId: 'org-1',
    });
    expect(result.name).toBe('Test');
    expect(repo.save).toHaveBeenCalled();
  });

  it('throws BadRequestException for polygon with fewer than 3 points', () => {
    expect(() =>
      service.create({
        name: 'Bad',
        polygon: [{ lat: 1, lng: 1 }],
        organizationId: 'org-1',
      }),
    ).toThrow(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('throws BadRequestException for empty polygon', () => {
    expect(() =>
      service.create({ name: 'Empty', polygon: [], organizationId: 'org-1' }),
    ).toThrow(BadRequestException);
  });

  it('soft-deletes a geofence by setting isActive=false', async () => {
    await service.remove('gf-1', 'org-1');
    expect(repo.update).toHaveBeenCalledWith(
      { id: 'gf-1', organizationId: 'org-1' },
      { isActive: false },
    );
  });
});
