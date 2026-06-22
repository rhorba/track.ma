import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../entities/trip.entity';
import { Position } from '../../entities/position.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Position])],
  providers: [TripsService],
  controllers: [TripsController],
  exports: [TripsService],
})
export class TripsModule {}
