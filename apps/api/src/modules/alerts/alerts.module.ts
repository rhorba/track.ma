import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from '../../entities/alert.entity';
import { AlertRule } from '../../entities/alert-rule.entity';
import { Geofence } from '../../entities/geofence.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertEngineService } from './alert-engine.service';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, AlertRule, Geofence])],
  providers: [AlertsService, AlertEngineService],
  controllers: [AlertsController],
  exports: [AlertsService, AlertEngineService],
})
export class AlertsModule {}
