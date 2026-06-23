import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Trip } from '../../entities/trip.entity';
import { Alert } from '../../entities/alert.entity';

const makeQb = (rawOne: any, many: any[] = [], rawMany: any[] = []) => ({
  innerJoin: jest.fn().mockReturnThis(),
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue(rawOne),
  getRawMany: jest.fn().mockResolvedValue(rawMany),
  getMany: jest.fn().mockResolvedValue(many),
});

const mockTripsRepo = { createQueryBuilder: jest.fn() };
const mockAlertsRepo = { createQueryBuilder: jest.fn() };

const ORG_ID = 'org-1';
const FROM = new Date('2026-01-01');
const TO = new Date('2026-01-31');

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Trip), useValue: mockTripsRepo },
        { provide: getRepositoryToken(Alert), useValue: mockAlertsRepo },
      ],
    }).compile();
    service = module.get(ReportsService);
  });

  describe('getFleetSummary', () => {
    it('returns fleet summary from query builder', async () => {
      const summary = {
        totalKm: '1234.5',
        totalFuel: '100',
        totalTrips: '10',
        avgSpeed: '80',
      };
      mockTripsRepo.createQueryBuilder.mockReturnValue(makeQb(summary));

      const result = await service.getFleetSummary(ORG_ID, FROM, TO);
      expect(mockTripsRepo.createQueryBuilder).toHaveBeenCalledWith('t');
      expect(result).toEqual(summary);
    });

    it('returns zeros when no trips in range', async () => {
      const empty = {
        totalKm: '0',
        totalFuel: '0',
        totalTrips: '0',
        avgSpeed: '0',
      };
      mockTripsRepo.createQueryBuilder.mockReturnValue(makeQb(empty));
      const result = await service.getFleetSummary(ORG_ID, FROM, TO);
      expect(result.totalTrips).toBe('0');
    });
  });

  describe('getByVehicle', () => {
    it('returns per-vehicle aggregated stats', async () => {
      const rows = [
        {
          vehicleId: 'v-1',
          vehicleName: 'Truck 1',
          totalKm: '500',
          totalFuel: '40',
          avgSpeed: '70',
          tripCount: '5',
        },
      ];
      const qb = makeQb(null, [], rows);
      mockTripsRepo.createQueryBuilder.mockReturnValue(qb);
      const result = await service.getByVehicle(ORG_ID, FROM, TO);
      expect(result).toEqual(rows);
      expect(qb.groupBy).toHaveBeenCalledWith('v.id');
      expect(qb.addGroupBy).toHaveBeenCalledWith('v.name');
    });

    it('returns empty array when no trips exist', async () => {
      const qb = makeQb(null, [], []);
      mockTripsRepo.createQueryBuilder.mockReturnValue(qb);
      const result = await service.getByVehicle(ORG_ID, FROM, TO);
      expect(result).toHaveLength(0);
    });
  });

  describe('getTrips', () => {
    const TRIPS = [{ id: 't-1', vehicleId: 'v-1', distanceKm: 50 }];

    it('returns trips for org in date range', async () => {
      mockTripsRepo.createQueryBuilder.mockReturnValue(makeQb(null, TRIPS));
      const result = await service.getTrips(ORG_ID, undefined, FROM, TO);
      expect(result).toEqual(TRIPS);
    });

    it('filters by vehicleId when provided', async () => {
      const qb = makeQb(null, TRIPS);
      mockTripsRepo.createQueryBuilder.mockReturnValue(qb);
      await service.getTrips(ORG_ID, 'v-1', FROM, TO);
      expect(qb.andWhere).toHaveBeenCalledWith('t.vehicleId = :vehicleId', {
        vehicleId: 'v-1',
      });
    });

    it('does not add vehicleId filter when undefined', async () => {
      const qb = makeQb(null, TRIPS);
      mockTripsRepo.createQueryBuilder.mockReturnValue(qb);
      await service.getTrips(ORG_ID, undefined, FROM, TO);
      const calls = qb.andWhere.mock.calls.map((c: any) => c[0]);
      expect(calls.some((c: string) => c.includes('vehicleId'))).toBe(false);
    });
  });
});
