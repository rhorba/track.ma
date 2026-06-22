import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from '../../entities/position.entity';
import { Vehicle } from '../../entities/vehicle.entity';
import { FleetService } from './fleet.service';
import { FleetGateway } from './fleet.gateway';
import { FleetController } from './fleet.controller';
import { DemoService } from './demo.service';
import { AlertsModule } from '../alerts/alerts.module';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Position, Vehicle]),
    AlertsModule,
    TripsModule,
  ],
  controllers: [FleetController],
  providers: [FleetService, FleetGateway, DemoService],
  exports: [FleetService, DemoService],
})
export class FleetModule {}
