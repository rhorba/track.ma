import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MqttIngestionModule } from './modules/mqtt-ingestion/mqtt-ingestion.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MqttIngestionModule],
})
export class AppModule {}
