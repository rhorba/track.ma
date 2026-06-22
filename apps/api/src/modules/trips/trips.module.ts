import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../entities/trip.entity';
import { Position } from '../../entities/position.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TripDetectorService } from './trip-detector.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Position])],
  providers: [TripsService, TripDetectorService],
  controllers: [TripsController],
  exports: [TripsService, TripDetectorService],
})
export class TripsModule {}
