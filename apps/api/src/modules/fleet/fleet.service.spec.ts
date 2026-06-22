import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FleetService } from './fleet.service';
import { Position } from '../../entities/position.entity';
import { Vehicle } from '../../entities/vehicle.entity';
import { REDIS_CLIENT } from '../redis/redis.module';

const mockPositionsRepo = {
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockVehiclesRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
};

const mockRedis = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
};

const VEHICLE: Partial<Vehicle> = { id: 'v-1', imei: '123456789012345', organizationId: 'org-1', isActive: true };

const BASE_POS = {
  imei: '123456789012345',
  lat: 33.57,
  lng: -7.59,
  speed: 60,
  heading: 90,
  altitude: 0,
  satellites: 8,
  ignition: true,
  fuelLevel: 50,
  odometer: 1000,
  timestamp: new Date(),
  organizationId: 'org-1',
};

describe('FleetService', () => {
  let service: FleetService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FleetService,
        { provide: getRepositoryToken(Position), useValue: mockPositionsRepo },
        { provide: getRepositoryToken(Vehicle), useValue: mockVehiclesRepo },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();
    service = module.get(FleetService);
  });

  describe('storePosition', () => {
    it('returns null when IMEI not registered', async () => {
      mockVehiclesRepo.findOne.mockResolvedValue(null);
      const result = await service.storePosition(BASE_POS);
      expect(result).toBeNull();
    });

    it('saves position and caches in Redis when vehicle found', async () => {
      mockVehiclesRepo.findOne.mockResolvedValue(VEHICLE);
      const posEntity = { id: 'p-1', ...BASE_POS };
      mockPositionsRepo.create.mockReturnValue(posEntity);
      mockPositionsRepo.save.mockResolvedValue(posEntity);

      const result = await service.storePosition(BASE_POS);

      expect(mockPositionsRepo.save).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalledWith(
        `vehicle:${VEHICLE.id}:latest`,
        expect.any(String),
        'EX',
        300,
      );
      expect(result).toEqual(VEHICLE);
    });

    it('sets status to active when ignition=true and speed>0', async () => {
      mockVehiclesRepo.findOne.mockResolvedValue(VEHICLE);
      mockPositionsRepo.create.mockReturnValue({});
      mockPositionsRepo.save.mockResolvedValue({});
      await service.storePosition({ ...BASE_POS, ignition: true, speed: 60 });
      expect(mockVehiclesRepo.update).toHaveBeenCalledWith(VEHICLE.id, { status: 'active' });
    });

    it('sets status to idle when ignition=true and speed=0', async () => {
      mockVehiclesRepo.findOne.mockResolvedValue(VEHICLE);
      mockPositionsRepo.create.mockReturnValue({});
      mockPositionsRepo.save.mockResolvedValue({});
      await service.storePosition({ ...BASE_POS, ignition: true, speed: 0 });
      expect(mockVehiclesRepo.update).toHaveBeenCalledWith(VEHICLE.id, { status: 'idle' });
    });

    it('sets status to offline when ignition=false', async () => {
      mockVehiclesRepo.findOne.mockResolvedValue(VEHICLE);
      mockPositionsRepo.create.mockReturnValue({});
      mockPositionsRepo.save.mockResolvedValue({});
      await service.storePosition({ ...BASE_POS, ignition: false, speed: 0 });
      expect(mockVehiclesRepo.update).toHaveBeenCalledWith(VEHICLE.id, { status: 'offline' });
    });
  });

  describe('getLatestPositions', () => {
    it('returns vehicles with cached positions from Redis', async () => {
      mockVehiclesRepo.find.mockResolvedValue([VEHICLE]);
      const cached = JSON.stringify({ lat: 33.57, lng: -7.59 });
      mockRedis.get.mockResolvedValue(cached);

      const result = await service.getLatestPositions('org-1');
      expect(result).toHaveLength(1);
      expect(result[0].vehicle).toEqual(VEHICLE);
      expect(result[0].position).toEqual(JSON.parse(cached));
    });

    it('returns null position when cache miss', async () => {
      mockVehiclesRepo.find.mockResolvedValue([VEHICLE]);
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getLatestPositions('org-1');
      expect(result[0].position).toBeNull();
    });
  });

  describe('getHistory', () => {
    it('queries positions within time range', async () => {
      const positions = [{ id: 'p-1' }];
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(positions),
      };
      mockPositionsRepo.createQueryBuilder.mockReturnValue(qb);

      const from = new Date('2026-01-01');
      const to = new Date('2026-01-31');
      const result = await service.getHistory('v-1', from, to);

      expect(mockPositionsRepo.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(result).toEqual(positions);
    });
  });
});
