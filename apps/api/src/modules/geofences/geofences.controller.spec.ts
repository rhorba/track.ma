import { Test, TestingModule } from '@nestjs/testing';
import { GeofencesController } from './geofences.controller';
import { GeofencesService } from './geofences.service';

const mockService = {
  list: jest.fn().mockResolvedValue([{ id: 'g-1', name: 'Zone A' }]),
  create: jest.fn().mockResolvedValue({ id: 'g-2', name: 'Zone B' }),
  remove: jest.fn().mockResolvedValue(undefined),
};

const REQ = { user: { organizationId: 'org-1' } };

describe('GeofencesController', () => {
  let controller: GeofencesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeofencesController],
      providers: [{ provide: GeofencesService, useValue: mockService }],
    }).compile();
    controller = module.get(GeofencesController);
  });

  it('list returns org geofences', async () => {
    const result = await controller.list(REQ);
    expect(mockService.list).toHaveBeenCalledWith('org-1');
    expect(result).toHaveLength(1);
  });

  it('create passes body with orgId to service', async () => {
    const body = { name: 'Zone B', polygon: [{ lat: 33.5, lng: -7.6 }] } as any;
    const result = await controller.create(body, REQ);
    expect(mockService.create).toHaveBeenCalledWith({
      name: 'Zone B',
      polygon: [{ lat: 33.5, lng: -7.6 }],
      organizationId: 'org-1',
    });
    expect(result).toHaveProperty('id', 'g-2');
  });

  it('remove delegates with id and orgId', async () => {
    await controller.remove('g-1', REQ);
    expect(mockService.remove).toHaveBeenCalledWith('g-1', 'org-1');
  });
});
