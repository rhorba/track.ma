import { Test, TestingModule } from '@nestjs/testing';
import { DemoService } from './demo.service';
import { FleetGateway } from './fleet.gateway';

const mockServer = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};

const mockGateway = {
  server: mockServer,
};

describe('DemoService', () => {
  let service: DemoService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoService,
        { provide: FleetGateway, useValue: mockGateway },
      ],
    }).compile();
    service = module.get(DemoService);
  });

  it('getInitialPositions returns 5 demo vehicles', () => {
    const positions = service.getInitialPositions();
    expect(positions).toHaveLength(5);
    positions.forEach((p) => {
      expect(p.vehicleId).toMatch(/^demo-\d$/);
      expect(p.imei).toMatch(/^DEMO\d$/);
      expect(typeof p.lat).toBe('number');
      expect(typeof p.lng).toBe('number');
      expect(p.ignition).toBe(true);
    });
  });

  it('getInitialPositions returns coords within Casablanca bounding box', () => {
    const positions = service.getInitialPositions();
    positions.forEach((p) => {
      expect(p.lat).toBeGreaterThanOrEqual(33.50);
      expect(p.lat).toBeLessThanOrEqual(33.65);
      expect(p.lng).toBeGreaterThanOrEqual(-7.70);
      expect(p.lng).toBeLessThanOrEqual(-7.50);
    });
  });

  it('broadcast emits to demo room for each vehicle', () => {
    service.broadcast();
    expect(mockServer.to).toHaveBeenCalledWith('demo');
    expect(mockServer.emit).toHaveBeenCalledTimes(5);
    const emitCall = mockServer.emit.mock.calls[0];
    expect(emitCall[0]).toBe('position');
    expect(emitCall[1]).toHaveProperty('vehicleId');
    expect(emitCall[1]).toHaveProperty('lat');
    expect(emitCall[1]).toHaveProperty('timestamp');
  });

  it('broadcast skips when server is not initialized', () => {
    (mockGateway as any).server = null;
    service.broadcast();
    expect(mockServer.emit).not.toHaveBeenCalled();
  });

  it('broadcast updates positions within bbox constraints', () => {
    service.broadcast();
    const positions = service.getInitialPositions();
    positions.forEach((p) => {
      expect(p.lat).toBeGreaterThanOrEqual(33.50);
      expect(p.lat).toBeLessThanOrEqual(33.65);
    });
  });
});
