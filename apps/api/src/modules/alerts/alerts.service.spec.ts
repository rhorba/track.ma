import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { Alert } from '../../entities/alert.entity';
import { AlertRule } from '../../entities/alert-rule.entity';
import { Geofence } from '../../entities/geofence.entity';

const mockAlertsRepo = {
  createQueryBuilder: jest.fn(),
  update: jest.fn(),
};
const mockRulesRepo = {
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockGeofencesRepo = {
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const ORG_ID = 'org-1';

function makeQb(many: any[] = []) {
  return {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(many),
  };
}

describe('AlertsService', () => {
  let service: AlertsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: getRepositoryToken(Alert), useValue: mockAlertsRepo },
        { provide: getRepositoryToken(AlertRule), useValue: mockRulesRepo },
        { provide: getRepositoryToken(Geofence), useValue: mockGeofencesRepo },
      ],
    }).compile();
    service = module.get(AlertsService);
  });

  it('getAlerts returns latest 100 alerts for org', async () => {
    const alerts = [{ id: 'a-1' }];
    mockAlertsRepo.createQueryBuilder.mockReturnValue(makeQb(alerts));
    const result = await service.getAlerts(ORG_ID);
    expect(mockAlertsRepo.createQueryBuilder).toHaveBeenCalledWith('a');
    expect(result).toEqual(alerts);
  });

  it('getRules returns all rules for org', async () => {
    const rules = [{ id: 'r-1', type: 'speeding' }];
    mockRulesRepo.find.mockResolvedValue(rules);
    const result = await service.getRules(ORG_ID);
    expect(mockRulesRepo.find).toHaveBeenCalledWith({ where: { organizationId: ORG_ID } });
    expect(result).toEqual(rules);
  });

  it('createRule creates and saves rule', async () => {
    const rule = { type: 'speeding', organizationId: ORG_ID };
    mockRulesRepo.create.mockReturnValue(rule);
    mockRulesRepo.save.mockResolvedValue({ id: 'r-1', ...rule });
    const result = await service.createRule(rule as any);
    expect(mockRulesRepo.create).toHaveBeenCalledWith(rule);
    expect(result.id).toBe('r-1');
  });

  it('acknowledge sets acknowledged=true with timestamp', async () => {
    mockAlertsRepo.update.mockResolvedValue(undefined);
    await service.acknowledge('a-1');
    expect(mockAlertsRepo.update).toHaveBeenCalledWith(
      'a-1',
      expect.objectContaining({ acknowledged: true, acknowledgedAt: expect.any(Date) }),
    );
  });

  it('getGeofences returns active geofences for org', async () => {
    const geofences = [{ id: 'g-1', name: 'Zone A' }];
    mockGeofencesRepo.find.mockResolvedValue(geofences);
    const result = await service.getGeofences(ORG_ID);
    expect(mockGeofencesRepo.find).toHaveBeenCalledWith({ where: { organizationId: ORG_ID, isActive: true } });
    expect(result).toEqual(geofences);
  });

  it('createGeofence creates and saves geofence', async () => {
    const data = { name: 'Port Zone', polygon: [], organizationId: ORG_ID };
    mockGeofencesRepo.create.mockReturnValue(data);
    mockGeofencesRepo.save.mockResolvedValue({ id: 'g-1', ...data });
    const result = await service.createGeofence(data as any);
    expect(result.id).toBe('g-1');
  });

  it('deleteGeofence soft-deletes by setting isActive=false', async () => {
    mockGeofencesRepo.update.mockResolvedValue(undefined);
    await service.deleteGeofence('g-1', ORG_ID);
    expect(mockGeofencesRepo.update).toHaveBeenCalledWith(
      { id: 'g-1', organizationId: ORG_ID },
      { isActive: false },
    );
  });
});
