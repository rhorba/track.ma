import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import Redis from 'ioredis';
import { GpsPosition, REDIS_CHANNELS } from '@trackma/shared';

const TELTONIKA_IO = { IGNITION: 239, FUEL_LEVEL: 9, ODOMETER: 16 };

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v);
}

function validatePosition(pos: GpsPosition): string | null {
  if (!pos.imei || typeof pos.imei !== 'string') return 'missing imei';
  if (!isFiniteNumber(pos.lat) || pos.lat < -90 || pos.lat > 90)
    return `invalid lat: ${pos.lat}`;
  if (!isFiniteNumber(pos.lng) || pos.lng < -180 || pos.lng > 180)
    return `invalid lng: ${pos.lng}`;
  if (!isFiniteNumber(pos.speed) || pos.speed < 0)
    return `invalid speed: ${pos.speed}`;
  return null;
}

@Injectable()
export class MqttIngestionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttIngestionService.name);
  private client: mqtt.MqttClient;

  constructor(
    private config: ConfigService,
    @Inject('REDIS_PUBLISHER') private redis: Redis,
  ) {}

  onModuleInit() {
    const brokerUrl = this.config.get<string>(
      'MQTT_BROKER_URL',
      'mqtt://localhost:1883',
    );
    this.client = mqtt.connect(brokerUrl);

    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker: ${brokerUrl}`);
      this.client.subscribe('trackma/devices/+/position', { qos: 1 });
      this.client.subscribe('trackma/teltonika/+', { qos: 1 });
    });

    this.client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload).catch((err) =>
        this.logger.error(`Failed to process MQTT message on ${topic}: ${err}`),
      );
    });

    this.client.on('error', (err) => this.logger.error(`MQTT error: ${err}`));
  }

  onModuleDestroy() {
    this.client?.end();
  }

  private async handleMessage(topic: string, payload: Buffer): Promise<void> {
    const topicParts = topic.split('/');
    const imei = topicParts[2];

    if (topic.includes('/position')) {
      let raw: Record<string, unknown>;
      try {
        raw = JSON.parse(payload.toString());
      } catch {
        this.logger.warn(`Malformed JSON on topic ${topic} — dropping`);
        return;
      }

      const pos: GpsPosition = {
        imei,
        vehicleId: (raw.vehicleId as string) || imei,
        lat: raw.lat as number,
        lng: raw.lng as number,
        speed: (raw.speed as number) ?? 0,
        heading: (raw.heading as number) ?? 0,
        altitude: (raw.altitude as number) ?? 0,
        satellites: (raw.satellites as number) ?? 0,
        ignition: (raw.ignition as boolean) ?? false,
        fuelLevel: raw.fuelLevel as number | undefined,
        odometer: raw.odometer as number | undefined,
        timestamp: new Date((raw.timestamp as string | number) || Date.now()),
      };

      const err = validatePosition(pos);
      if (err) {
        this.logger.warn(
          `Invalid position from IMEI ${imei}: ${err} — dropping`,
        );
        return;
      }

      await this.publishPosition(pos);
    } else if (topic.includes('/teltonika/')) {
      await this.parseTeltonikaRecord(imei, payload);
    }
  }

  private async parseTeltonikaRecord(
    imei: string,
    payload: Buffer,
  ): Promise<void> {
    let record: Record<string, unknown>;
    try {
      record = JSON.parse(payload.toString());
    } catch (err) {
      this.logger.warn(
        `Malformed Teltonika JSON for IMEI ${imei}: ${err} — dropping`,
      );
      return;
    }

    const io = (record.ioElements as Record<number, number>) || {};
    const pos: GpsPosition = {
      imei,
      vehicleId: imei,
      lat: record.lat as number,
      lng: record.lng as number,
      speed: record.speed as number,
      heading: record.angle as number,
      altitude: record.altitude as number,
      satellites: record.satellites as number,
      ignition: io[TELTONIKA_IO.IGNITION] === 1,
      fuelLevel: io[TELTONIKA_IO.FUEL_LEVEL] ?? undefined,
      odometer: io[TELTONIKA_IO.ODOMETER] ?? undefined,
      timestamp: new Date(record.timestamp as string | number),
    };

    const err = validatePosition(pos);
    if (err) {
      this.logger.warn(
        `Invalid Teltonika position from IMEI ${imei}: ${err} — dropping`,
      );
      return;
    }

    await this.publishPosition(pos);
  }

  private async publishPosition(pos: GpsPosition): Promise<void> {
    const dedupKey = `dedup:pos:${pos.imei}`;
    const acquired = await this.redis.set(dedupKey, '1', 'EX', 1, 'NX');
    if (!acquired) {
      this.logger.debug(
        `Rate-limited duplicate from IMEI ${pos.imei} — dropping`,
      );
      return;
    }

    await this.redis.publish(REDIS_CHANNELS.GPS_POSITION, JSON.stringify(pos));
    this.logger.debug(`Published position for IMEI ${pos.imei}`);
  }
}
