import { Test, TestingModule } from '@nestjs/testing';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

const mockService = {
  getTrips: jest.fn().mockResolvedValue([{ id: 't-1' }]),
  getTripPositions: jest.fn().mockResolvedValue([{ id: 'p-1' }]),
};

describe('TripsController', () => {
  let controller: TripsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [{ provide: TripsService, useValue: mockService }],
    }).compile();
    controller = module.get(TripsController);
  });

  it('list delegates to service.getTrips', async () => {
    const result = await controller.list('v-1');
    expect(mockService.getTrips).toHaveBeenCalledWith('v-1');
    expect(result).toEqual([{ id: 't-1' }]);
  });

  it('positions delegates to service.getTripPositions', async () => {
    const result = await controller.positions('t-1');
    expect(mockService.getTripPositions).toHaveBeenCalledWith('t-1');
    expect(result).toEqual([{ id: 'p-1' }]);
  });
});
