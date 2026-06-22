import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TripsService } from './trips.service';
import { Trip } from '../../entities/trip.entity';
import { Position } from '../../entities/position.entity';

const mockTripsRepo = {
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockPositionsRepo = {
  createQueryBuilder: jest.fn(),
};

const VEHICLE_ID = 'v-1';
const TRIP: Partial<Trip> = { id: 't-1', vehicleId: VEHICLE_ID, isComplete: true, distanceKm: 12.5 };

describe('TripsService', () => {
  let service: TripsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: getRepositoryToken(Trip), useValue: mockTripsRepo },
        { provide: getRepositoryToken(Position), useValue: mockPositionsRepo },
      ],
    }).compile();
    service = module.get(TripsService);
  });

  describe('getTrips', () => {
    it('returns completed trips for vehicle ordered by date desc', async () => {
      mockTripsRepo.find.mockResolvedValue([TRIP]);
      const result = await service.getTrips(VEHICLE_ID);
      expect(mockTripsRepo.find).toHaveBeenCalledWith({
        where: { vehicleId: VEHICLE_ID, isComplete: true },
        order: { startedAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual([TRIP]);
    });

    it('returns empty array when no trips', async () => {
      mockTripsRepo.find.mockResolvedValue([]);
      const result = await service.getTrips(VEHICLE_ID);
      expect(result).toEqual([]);
    });
  });

  describe('getTripPositions', () => {
    it('queries positions within trip time window', async () => {
      const positions = [{ id: 'p-1', lat: 33.5, lng: -7.6 }];
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(positions),
      };
      mockPositionsRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getTripPositions('t-1');
      expect(mockPositionsRepo.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(qb.getMany).toHaveBeenCalled();
      expect(result).toEqual(positions);
    });
  });
});
