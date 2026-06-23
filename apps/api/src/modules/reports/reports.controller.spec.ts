import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

const mockService = {
  getFleetSummary: jest
    .fn()
    .mockResolvedValue({ totalKm: '500', totalTrips: '10' }),
  getTrips: jest.fn().mockResolvedValue([{ id: 't-1' }]),
};

const REQ = { user: { organizationId: 'org-1' } };

describe('ReportsController', () => {
  let controller: ReportsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockService }],
    }).compile();
    controller = module.get(ReportsController);
  });

  it('summary delegates to service with parsed dates', async () => {
    const from = '2026-01-01';
    const to = '2026-01-31';
    const result = await controller.summary(REQ, from, to);
    expect(mockService.getFleetSummary).toHaveBeenCalledWith(
      'org-1',
      new Date(from),
      new Date(to),
    );
    expect(result).toHaveProperty('totalKm');
  });

  it('summary uses default dates when not provided', async () => {
    await controller.summary(REQ, '', '');
    const [, from, to] = mockService.getFleetSummary.mock.calls[0];
    expect(from).toBeInstanceOf(Date);
    expect(to).toBeInstanceOf(Date);
  });

  it('trips delegates to service with vehicleId filter', async () => {
    const result = await controller.trips(
      REQ,
      'v-1',
      '2026-01-01',
      '2026-01-31',
    );
    expect(mockService.getTrips).toHaveBeenCalledWith(
      'org-1',
      'v-1',
      expect.any(Date),
      expect.any(Date),
    );
    expect(result).toHaveLength(1);
  });

  it('trips passes undefined vehicleId when not provided', async () => {
    await controller.trips(REQ, '', '2026-01-01', '2026-01-31');
    expect(mockService.getTrips).toHaveBeenCalledWith(
      'org-1',
      '',
      expect.any(Date),
      expect.any(Date),
    );
  });
});
