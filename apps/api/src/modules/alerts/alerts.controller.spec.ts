import { Test, TestingModule } from '@nestjs/testing';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

const mockService = {
  getAlerts: jest.fn().mockResolvedValue([]),
  getRules: jest.fn().mockResolvedValue([]),
  createRule: jest.fn().mockResolvedValue({ id: 'r-1' }),
  acknowledge: jest.fn().mockResolvedValue(undefined),
};

const REQ = { user: { organizationId: 'org-1' } };

describe('AlertsController', () => {
  let controller: AlertsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [{ provide: AlertsService, useValue: mockService }],
    }).compile();
    controller = module.get(AlertsController);
  });

  it('list delegates to service.getAlerts with orgId', async () => {
    await controller.list(REQ);
    expect(mockService.getAlerts).toHaveBeenCalledWith('org-1');
  });

  it('rules delegates to service.getRules with orgId', async () => {
    await controller.rules(REQ);
    expect(mockService.getRules).toHaveBeenCalledWith('org-1');
  });

  it('createRule merges orgId into body', async () => {
    const body = { type: 'speeding', config: { speedLimit: 120 } };
    await controller.createRule(body, REQ);
    expect(mockService.createRule).toHaveBeenCalledWith({ ...body, organizationId: 'org-1' });
  });

  it('acknowledge delegates to service.acknowledge with id', async () => {
    await controller.acknowledge('a-1');
    expect(mockService.acknowledge).toHaveBeenCalledWith('a-1');
  });
});
