import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../../entities/trip.entity';
import { Alert } from '../../entities/alert.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Trip) private tripsRepo: Repository<Trip>,
    @InjectRepository(Alert) private alertsRepo: Repository<Alert>,
  ) {}

  async getFleetSummary(organizationId: string, from: Date, to: Date) {
    const trips = await this.tripsRepo
      .createQueryBuilder('t')
      .innerJoin('t.vehicle', 'v', 'v.organizationId = :organizationId', { organizationId })
      .where('t.startedAt BETWEEN :from AND :to', { from, to })
      .select(['SUM(t.distanceKm) AS totalKm', 'SUM(t.fuelConsumedL) AS totalFuel', 'COUNT(t.id) AS totalTrips'])
      .getRawOne();
    return trips;
  }
}
