import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

const mockService = {
  findByOrg: jest.fn().mockResolvedValue([{ id: 'v-1' }]),
  findOne: jest.fn().mockResolvedValue({ id: 'v-1' }),
  create: jest.fn().mockResolvedValue({ id: 'v-1' }),
  update: jest.fn().mockResolvedValue({ id: 'v-1', name: 'Updated' }),
  remove: jest.fn().mockResolvedValue(undefined),
};

const REQ = { user: { organizationId: 'org-1' } };

describe('VehiclesController', () => {
  let controller: VehiclesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: mockService }],
    }).compile();
    controller = module.get(VehiclesController);
  });

  it('list returns org vehicles', async () => {
    const result = await controller.list(REQ);
    expect(mockService.findByOrg).toHaveBeenCalledWith('org-1');
    expect(result).toHaveLength(1);
  });

  it('get returns single vehicle', async () => {
    const result = await controller.get('v-1', REQ);
    expect(mockService.findOne).toHaveBeenCalledWith('v-1', 'org-1');
    expect(result).toEqual({ id: 'v-1' });
  });

  it('create passes dto and orgId to service', async () => {
    const dto = { name: 'Truck 1', imei: '123456789012345' } as any;
    await controller.create(dto, REQ);
    expect(mockService.create).toHaveBeenCalledWith(dto, 'org-1');
  });

  it('update passes id, dto and orgId to service', async () => {
    const dto = { name: 'Updated' } as any;
    const result = await controller.update('v-1', dto, REQ);
    expect(mockService.update).toHaveBeenCalledWith('v-1', dto, 'org-1');
    expect(result).toHaveProperty('name', 'Updated');
  });

  it('remove passes id and orgId to service', async () => {
    await controller.remove('v-1', REQ);
    expect(mockService.remove).toHaveBeenCalledWith('v-1', 'org-1');
  });
});
