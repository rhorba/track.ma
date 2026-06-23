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
    const result = await this.tripsRepo
      .createQueryBuilder('t')
      .innerJoin('t.vehicle', 'v', 'v.organizationId = :organizationId', {
        organizationId,
      })
      .where('t.startedAt BETWEEN :from AND :to', { from, to })
      .andWhere('t.isComplete = true')
      .select([
        'COALESCE(SUM(t.distanceKm), 0) AS "totalKm"',
        'COALESCE(SUM(t.fuelConsumedL), 0) AS "totalFuel"',
        'COUNT(t.id) AS "totalTrips"',
        'COALESCE(AVG(t.avgSpeedKmh), 0) AS "avgSpeed"',
      ])
      .getRawOne();
    return result;
  }

  getTrips(
    organizationId: string,
    vehicleId: string | undefined,
    from: Date,
    to: Date,
  ) {
    const qb = this.tripsRepo
      .createQueryBuilder('t')
      .innerJoinAndSelect(
        't.vehicle',
        'v',
        'v.organizationId = :organizationId',
        { organizationId },
      )
      .where('t.startedAt BETWEEN :from AND :to', { from, to })
      .andWhere('t.isComplete = true')
      .orderBy('t.startedAt', 'DESC')
      .take(200);

    if (vehicleId) qb.andWhere('t.vehicleId = :vehicleId', { vehicleId });
    return qb.getMany();
  }
}
