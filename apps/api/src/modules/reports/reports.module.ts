import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from '../../entities/trip.entity';
import { Alert } from '../../entities/alert.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Alert])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
