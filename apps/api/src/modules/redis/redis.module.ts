import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_SUBSCRIBER = 'REDIS_SUBSCRIBER';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) =>
        new Redis(config.get<string>('REDIS_URL')!),
      inject: [ConfigService],
    },
    {
      provide: REDIS_SUBSCRIBER,
      useFactory: (config: ConfigService) =>
        new Redis(config.get<string>('REDIS_URL')!),
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT, REDIS_SUBSCRIBER],
})
export class RedisModule {}
