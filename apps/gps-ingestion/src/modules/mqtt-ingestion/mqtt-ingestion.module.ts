import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MqttIngestionService } from './mqtt-ingestion.service';

@Module({
  providers: [
    {
      provide: 'REDIS_PUBLISHER',
      useFactory: (config: ConfigService) => new Redis(config.get<string>('REDIS_URL')!),
      inject: [ConfigService],
    },
    MqttIngestionService,
  ],
})
export class MqttIngestionModule {}
