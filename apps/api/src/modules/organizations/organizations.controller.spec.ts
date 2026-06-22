import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

const mockService = {
  findById: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Test Org' }),
  getUsage: jest.fn().mockResolvedValue({ vehicleCount: 3, vehicleLimit: 5 }),
};

const REQ = { user: { organizationId: 'org-1' } };

describe('OrganizationsController', () => {
  let controller: OrganizationsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [{ provide: OrganizationsService, useValue: mockService }],
    }).compile();
    controller = module.get(OrganizationsController);
  });

  it('getMyOrg returns org for user orgId', async () => {
    const result = await controller.getMyOrg(REQ);
    expect(mockService.findById).toHaveBeenCalledWith('org-1');
    expect(result).toEqual({ id: 'org-1', name: 'Test Org' });
  });

  it('getUsage returns usage stats for org', async () => {
    const result = await controller.getUsage(REQ);
    expect(mockService.getUsage).toHaveBeenCalledWith('org-1');
    expect(result).toHaveProperty('vehicleLimit');
  });
});
