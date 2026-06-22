import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TripDetectorService } from './trip-detector.service';
import { Trip } from '../../entities/trip.entity';

const now = new Date('2026-06-22T10:00:00Z');
const later = new Date('2026-06-22T10:30:00Z');

const makePos = (overrides: object = {}) => ({
  vehicleId: 'v-1',
  imei: 'imei-1',
  lat: 33.9,
  lng: -6.85,
  speed: 60,
  heading: 0,
  altitude: 0,
  satellites: 8,
  ignition: true,
  fuelLevel: 50,
  odometer: 1000,
  timestamp: now,
  organizationId: 'org-1',
  ...overrides,
});

describe('TripDetectorService', () => {
  let service: TripDetectorService;
  let tripsRepo: any;

  beforeEach(async () => {
    let savedTrip: any = null;
    tripsRepo = {
      create: jest.fn((d) => d),
      save: jest.fn((d) => {
        savedTrip = { id: 'trip-1', ...d };
        return Promise.resolve(savedTrip);
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        TripDetectorService,
        { provide: getRepositoryToken(Trip), useValue: tripsRepo },
      ],
    }).compile();

    service = module.get(TripDetectorService);
  });

  it('opens a trip on ignition ON when none is open', async () => {
    await service.process(makePos({ ignition: true }), 'v-1');
    expect(tripsRepo.save).toHaveBeenCalledTimes(1);
    const saved = tripsRepo.save.mock.calls[0][0];
    expect(saved.isComplete).toBe(false);
    expect(saved.startLat).toBe(33.9);
  });

  it('does not open a second trip when one is already open', async () => {
    await service.process(makePos({ ignition: true }), 'v-1');
    await service.process(makePos({ ignition: true, lat: 33.91 }), 'v-1');
    expect(tripsRepo.save).toHaveBeenCalledTimes(1); // only the open call
  });

  it('closes a trip on ignition OFF', async () => {
    await service.process(makePos({ ignition: true }), 'v-1');
    await service.process(makePos({ ignition: false, timestamp: later }), 'v-1');
    expect(tripsRepo.save).toHaveBeenCalledTimes(2);
    const closedTrip = tripsRepo.save.mock.calls[1][0];
    expect(closedTrip.isComplete).toBe(true);
    expect(closedTrip.durationSeconds).toBe(1800); // 30 min
  });

  it('accumulates distance across positions', async () => {
    await service.process(makePos({ ignition: true, lat: 33.9, lng: -6.85 }), 'v-1');
    await service.process(makePos({ ignition: true, lat: 33.95, lng: -6.85 }), 'v-1');
    await service.process(makePos({ ignition: false, lat: 33.95, lng: -6.85, timestamp: later }), 'v-1');
    const closedTrip = tripsRepo.save.mock.calls[1][0];
    expect(closedTrip.distanceKm).toBeGreaterThan(0);
  });

  it('does not close a trip when no trip is open and ignition is off', async () => {
    await service.process(makePos({ ignition: false }), 'v-1');
    expect(tripsRepo.save).not.toHaveBeenCalled();
  });
});
