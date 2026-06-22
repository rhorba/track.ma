import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import Redis from 'ioredis';
import { GpsPosition, REDIS_CHANNELS } from '@trackma/shared';

const TELTONIKA_IO = { IGNITION: 239, FUEL_LEVEL: 9, ODOMETER: 16 };

@Injectable()
export class MqttIngestionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttIngestionService.name);
  private client: mqtt.MqttClient;

  constructor(
    private config: ConfigService,
    @Inject('REDIS_PUBLISHER') private redis: Redis,
  ) {}

  onModuleInit() {
    const brokerUrl = this.config.get<string>('MQTT_BROKER_URL', 'mqtt://localhost:1883');
    this.client = mqtt.connect(brokerUrl);

    this.client.on('connect', () => {
      this.logger.log(`Connected to MQTT broker: ${brokerUrl}`);
      this.client.subscribe('trackma/devices/+/position', { qos: 1 });
      this.client.subscribe('trackma/teltonika/+', { qos: 1 });
    });

    this.client.on('message', (topic, payload) => {
      try {
        this.handleMessage(topic, payload);
      } catch (err) {
        this.logger.error(`Failed to process MQTT message on ${topic}: ${err}`);
      }
    });

    this.client.on('error', (err) => this.logger.error(`MQTT error: ${err}`));
  }

  onModuleDestroy() {
    this.client?.end();
  }

  private handleMessage(topic: string, payload: Buffer) {
    const topicParts = topic.split('/');
    const imei = topicParts[2];

    if (topic.includes('/position')) {
      const raw = JSON.parse(payload.toString());
      const pos: GpsPosition = {
        imei,
        vehicleId: raw.vehicleId || imei,
        lat: raw.lat,
        lng: raw.lng,
        speed: raw.speed || 0,
        heading: raw.heading || 0,
        altitude: raw.altitude || 0,
        satellites: raw.satellites || 0,
        ignition: raw.ignition || false,
        fuelLevel: raw.fuelLevel,
        odometer: raw.odometer,
        timestamp: new Date(raw.timestamp || Date.now()),
      };
      this.publishPosition(pos);
    } else if (topic.includes('/teltonika/')) {
      this.parseTeltonikaRecord(imei, payload);
    }
  }

  private parseTeltonikaRecord(imei: string, payload: Buffer) {
    try {
      const record = JSON.parse(payload.toString());
      const io = record.ioElements || {};
      const pos: GpsPosition = {
        imei,
        vehicleId: imei,
        lat: record.lat,
        lng: record.lng,
        speed: record.speed,
        heading: record.angle,
        altitude: record.altitude,
        satellites: record.satellites,
        ignition: io[TELTONIKA_IO.IGNITION] === 1,
        fuelLevel: io[TELTONIKA_IO.FUEL_LEVEL] ?? undefined,
        odometer: io[TELTONIKA_IO.ODOMETER] ?? undefined,
        timestamp: new Date(record.timestamp),
      };
      this.publishPosition(pos);
    } catch (err) {
      this.logger.warn(`Failed to parse Teltonika record for IMEI ${imei}: ${err}`);
    }
  }

  private async publishPosition(pos: GpsPosition) {
    await this.redis.publish(REDIS_CHANNELS.GPS_POSITION, JSON.stringify(pos));
    this.logger.debug(`Published position for IMEI ${pos.imei}`);
  }
}
