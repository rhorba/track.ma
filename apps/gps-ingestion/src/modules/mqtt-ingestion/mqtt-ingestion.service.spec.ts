import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MqttIngestionService } from './mqtt-ingestion.service';

const mockRedis = () => ({
  publish: jest.fn().mockResolvedValue(1),
  set: jest.fn().mockResolvedValue('OK'),
});

const mockMqttClient = {
  on: jest.fn(),
  subscribe: jest.fn(),
  end: jest.fn(),
};

jest.mock('mqtt', () => ({
  connect: jest.fn(() => mockMqttClient),
}));

const validPayload = (overrides: object = {}) =>
  Buffer.from(
    JSON.stringify({
      vehicleId: 'v-1',
      lat: 33.5731,
      lng: -7.5898,
      speed: 60,
      heading: 180,
      altitude: 50,
      satellites: 8,
      ignition: true,
      fuelLevel: 75,
      timestamp: new Date().toISOString(),
      ...overrides,
    }),
  );

const teltonikaPayload = (overrides: object = {}) =>
  Buffer.from(
    JSON.stringify({
      lat: 33.5731,
      lng: -7.5898,
      speed: 80,
      angle: 90,
      altitude: 100,
      satellites: 10,
      timestamp: new Date().toISOString(),
      ioElements: { 239: 1, 9: 65, 16: 123000 },
      ...overrides,
    }),
  );

describe('MqttIngestionService', () => {
  let service: MqttIngestionService;
  let redis: ReturnType<typeof mockRedis>;

  beforeEach(async () => {
    redis = mockRedis();
    mockMqttClient.on.mockReset();
    mockMqttClient.subscribe.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        MqttIngestionService,
        { provide: 'REDIS_PUBLISHER', useValue: redis },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('mqtt://localhost:1883') } },
      ],
    }).compile();

    service = module.get(MqttIngestionService);
    service.onModuleInit();
  });

  afterEach(() => service.onModuleDestroy());

  const dispatchMessage = (topic: string, payload: Buffer) => {
    const messageHandler = mockMqttClient.on.mock.calls.find(([e]) => e === 'message')?.[1];
    return messageHandler?.(topic, payload);
  };

  // ── Position topic ─────────────────────────────────────────────────────────

  it('publishes a valid position from /position topic', async () => {
    await dispatchMessage('trackma/devices/imei123/position', validPayload());
    expect(redis.publish).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"imei":"imei123"'),
    );
  });

  it('drops payload with invalid lat (NaN)', async () => {
    await dispatchMessage('trackma/devices/imei1/position', validPayload({ lat: NaN }));
    expect(redis.publish).not.toHaveBeenCalled();
  });

  it('drops payload with lat out of range (>90)', async () => {
    await dispatchMessage('trackma/devices/imei1/position', validPayload({ lat: 95 }));
    expect(redis.publish).not.toHaveBeenCalled();
  });

  it('drops payload with negative speed', async () => {
    await dispatchMessage('trackma/devices/imei1/position', validPayload({ speed: -10 }));
    expect(redis.publish).not.toHaveBeenCalled();
  });

  it('drops malformed JSON on /position topic', async () => {
    await dispatchMessage('trackma/devices/imei1/position', Buffer.from('not json'));
    expect(redis.publish).not.toHaveBeenCalled();
  });

  // ── Teltonika topic ────────────────────────────────────────────────────────

  it('parses a valid Teltonika record and publishes', async () => {
    await dispatchMessage('trackma/teltonika/imei456', teltonikaPayload());
    const call = (redis.publish as jest.Mock).mock.calls[0];
    const published = JSON.parse(call[1]);
    expect(published.imei).toBe('imei456');
    expect(published.ignition).toBe(true);
    expect(published.fuelLevel).toBe(65);
    expect(published.odometer).toBe(123000);
  });

  it('drops malformed Teltonika JSON', async () => {
    await dispatchMessage('trackma/teltonika/imei1', Buffer.from('{bad json'));
    expect(redis.publish).not.toHaveBeenCalled();
  });

  it('drops Teltonika record with invalid coordinates', async () => {
    await dispatchMessage('trackma/teltonika/imei1', teltonikaPayload({ lat: undefined }));
    expect(redis.publish).not.toHaveBeenCalled();
  });

  // ── Rate limiting ──────────────────────────────────────────────────────────

  it('drops duplicate position from same IMEI within 1 second', async () => {
    redis.set.mockResolvedValueOnce('OK').mockResolvedValueOnce(null);
    await dispatchMessage('trackma/devices/imei1/position', validPayload());
    await dispatchMessage('trackma/devices/imei1/position', validPayload());
    expect(redis.publish).toHaveBeenCalledTimes(1);
  });

  it('publishes when Redis SET NX returns OK (no recent duplicate)', async () => {
    redis.set.mockResolvedValue('OK');
    await dispatchMessage('trackma/devices/imei1/position', validPayload());
    expect(redis.publish).toHaveBeenCalledTimes(1);
  });

  it('uses 1-second EX on the dedup key', async () => {
    await dispatchMessage('trackma/devices/imei1/position', validPayload());
    expect(redis.set).toHaveBeenCalledWith(
      'dedup:pos:imei1',
      '1',
      'EX',
      1,
      'NX',
    );
  });
});
