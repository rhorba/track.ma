import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AlertEngineService } from './alert-engine.service';
import { Alert } from '../../entities/alert.entity';
import { AlertRule } from '../../entities/alert-rule.entity';
import { Geofence } from '../../entities/geofence.entity';

const makeRepo = (overrides: object = {}) => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  count: jest.fn().mockResolvedValue(0),
  create: jest.fn((d) => d),
  save: jest.fn((d) => Promise.resolve({ id: 'alert-1', ...d })),
  ...overrides,
});

const basePos = {
  vehicleId: 'v-1',
  imei: '123',
  lat: 15,
  lng: 15,
  speed: 0,
  heading: 0,
  altitude: 0,
  satellites: 5,
  ignition: false,
  fuelLevel: 50,
  odometer: 1000,
  timestamp: new Date(),
  organizationId: 'org-1',
};

describe('AlertEngineService', () => {
  let service: AlertEngineService;
  let rulesRepo: ReturnType<typeof makeRepo>;
  let alertsRepo: ReturnType<typeof makeRepo>;
  let geofencesRepo: ReturnType<typeof makeRepo>;

  beforeEach(async () => {
    rulesRepo = makeRepo();
    alertsRepo = makeRepo();
    geofencesRepo = makeRepo();

    const module = await Test.createTestingModule({
      providers: [
        AlertEngineService,
        { provide: getRepositoryToken(AlertRule), useValue: rulesRepo },
        { provide: getRepositoryToken(Alert), useValue: alertsRepo },
        { provide: getRepositoryToken(Geofence), useValue: geofencesRepo },
      ],
    }).compile();

    service = module.get(AlertEngineService);
  });

  it('returns null when no rules', async () => {
    rulesRepo.find.mockResolvedValue([]);
    const result = await service.evaluate(basePos, 'v-1', 'org-1');
    expect(result).toBeNull();
  });

  it('fires speeding alert when speed exceeds limit', async () => {
    rulesRepo.find.mockResolvedValue([
      {
        id: 'r-1',
        type: 'speeding',
        config: { speedLimit: 100 },
        organizationId: 'org-1',
        isActive: true,
      },
    ]);
    const pos = { ...basePos, speed: 130 };
    const alert = await service.evaluate(pos, 'v-1', 'org-1');
    expect(alert).not.toBeNull();
    expect(alert?.type).toBe('speeding');
    expect(alertsRepo.save).toHaveBeenCalled();
  });

  it('does not fire speeding alert when speed is under limit', async () => {
    rulesRepo.find.mockResolvedValue([
      {
        id: 'r-1',
        type: 'speeding',
        config: { speedLimit: 100 },
        organizationId: 'org-1',
        isActive: true,
      },
    ]);
    const pos = { ...basePos, speed: 80 };
    const result = await service.evaluate(pos, 'v-1', 'org-1');
    expect(result).toBeNull();
  });

  it('fires ignition_on alert when ignition is true', async () => {
    rulesRepo.find.mockResolvedValue([
      {
        id: 'r-2',
        type: 'ignition_on',
        config: {},
        organizationId: 'org-1',
        isActive: true,
      },
    ]);
    const pos = { ...basePos, ignition: true };
    const alert = await service.evaluate(pos, 'v-1', 'org-1');
    expect(alert?.type).toBe('ignition_on');
  });

  it('fires low_fuel alert when fuel below threshold', async () => {
    rulesRepo.find.mockResolvedValue([
      {
        id: 'r-3',
        type: 'low_fuel',
        config: { fuelThreshold: 15 },
        organizationId: 'org-1',
        isActive: true,
      },
    ]);
    const pos = { ...basePos, fuelLevel: 8 };
    const alert = await service.evaluate(pos, 'v-1', 'org-1');
    expect(alert?.type).toBe('low_fuel');
    expect(alert?.severity).toBe('critical');
  });

  it('deduplicates alerts within 5 minutes', async () => {
    rulesRepo.find.mockResolvedValue([
      {
        id: 'r-1',
        type: 'speeding',
        config: { speedLimit: 100 },
        organizationId: 'org-1',
        isActive: true,
      },
    ]);
    alertsRepo.count.mockResolvedValue(1); // already exists
    const pos = { ...basePos, speed: 130 };
    const result = await service.evaluate(pos, 'v-1', 'org-1');
    expect(result).toBeNull();
    expect(alertsRepo.save).not.toHaveBeenCalled();
  });

  it('fires geofence_enter when vehicle enters a geofence', async () => {
    const geofence = {
      id: 'gf-1',
      name: 'Zone A',
      isActive: true,
      polygon: [
        { lat: 10, lng: 10 },
        { lat: 10, lng: 20 },
        { lat: 20, lng: 20 },
        { lat: 20, lng: 10 },
      ],
    };
    rulesRepo.find.mockResolvedValue([
      {
        id: 'r-4',
        type: 'geofence_enter',
        config: { geofenceId: 'gf-1' },
        organizationId: 'org-1',
        isActive: true,
      },
    ]);
    geofencesRepo.findOne.mockResolvedValue(geofence);
    // Point inside the geofence square
    const pos = { ...basePos, lat: 15, lng: 15 };
    const alert = await service.evaluate(pos, 'v-new', 'org-1');
    expect(alert?.type).toBe('geofence_enter');
    expect(alert?.message).toContain('Zone A');
  });

  it('does not fire geofence_enter when vehicle is outside', async () => {
    const geofence = {
      id: 'gf-1',
      name: 'Zone A',
      isActive: true,
      polygon: [
        { lat: 10, lng: 10 },
        { lat: 10, lng: 20 },
        { lat: 20, lng: 20 },
        { lat: 20, lng: 10 },
      ],
    };
    rulesRepo.find.mockResolvedValue([
      {
        id: 'r-4',
        type: 'geofence_enter',
        config: { geofenceId: 'gf-1' },
        organizationId: 'org-1',
        isActive: true,
      },
    ]);
    geofencesRepo.findOne.mockResolvedValue(geofence);
    const pos = { ...basePos, lat: 5, lng: 5 };
    const result = await service.evaluate(pos, 'v-outside', 'org-1');
    expect(result).toBeNull();
  });

  it('fires geofence_exit when vehicle leaves geofence', async () => {
    const geofence = {
      id: 'gf-2',
      name: 'Zone B',
      isActive: true,
      polygon: [
        { lat: 10, lng: 10 },
        { lat: 10, lng: 20 },
        { lat: 20, lng: 20 },
        { lat: 20, lng: 10 },
      ],
    };
    rulesRepo.find.mockResolvedValue([
      {
        id: 'r-5',
        type: 'geofence_exit',
        config: { geofenceId: 'gf-2' },
        organizationId: 'org-1',
        isActive: true,
      },
    ]);
    geofencesRepo.findOne.mockResolvedValue(geofence);

    // First call: inside the geofence — sets state
    await service.evaluate({ ...basePos, lat: 15, lng: 15 }, 'v-exit', 'org-1');
    alertsRepo.save.mockClear();

    // Second call: outside — should fire exit
    const alert = await service.evaluate(
      { ...basePos, lat: 5, lng: 5 },
      'v-exit',
      'org-1',
    );
    expect(alert?.type).toBe('geofence_exit');
  });
});
