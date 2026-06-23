import { Test, TestingModule } from '@nestjs/testing';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';
import { DemoService } from './demo.service';

const mockFleetService = {
  getLatestPositions: jest.fn().mockResolvedValue([{ vehicleId: 'v-1' }]),
  getHistory: jest.fn().mockResolvedValue([{ lat: 33.5, lng: -7.6 }]),
};
const mockDemoService = {
  getInitialPositions: jest.fn().mockReturnValue([{ vehicleId: 'demo-1' }]),
};

const REQ = { user: { organizationId: 'org-1' } };

describe('FleetController', () => {
  let controller: FleetController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FleetController],
      providers: [
        { provide: FleetService, useValue: mockFleetService },
        { provide: DemoService, useValue: mockDemoService },
      ],
    }).compile();
    controller = module.get(FleetController);
  });

  it('getDemoPositions returns demo vehicle positions', () => {
    const result = controller.getDemoPositions();
    expect(mockDemoService.getInitialPositions).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('getPositions returns latest positions for org', async () => {
    const result = await controller.getPositions(REQ);
    expect(mockFleetService.getLatestPositions).toHaveBeenCalledWith('org-1');
    expect(result).toHaveLength(1);
  });

  it('getHistory returns position history with parsed dates', async () => {
    const result = await controller.getHistory(
      'v-1',
      '2026-01-01',
      '2026-01-31',
    );
    expect(mockFleetService.getHistory).toHaveBeenCalledWith(
      'v-1',
      new Date('2026-01-01'),
      new Date('2026-01-31'),
    );
    expect(result).toHaveLength(1);
  });
});
