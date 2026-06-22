import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from '../../entities/position.entity';
import { Vehicle } from '../../entities/vehicle.entity';
import { FleetService } from './fleet.service';
import { FleetGateway } from './fleet.gateway';
import { FleetController } from './fleet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Position, Vehicle])],
  controllers: [FleetController],
  providers: [FleetService, FleetGateway],
  exports: [FleetService],
})
export class FleetModule {}
