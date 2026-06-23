import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../../entities/trip.entity';
import { Position } from '../../entities/position.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip) private tripsRepo: Repository<Trip>,
    @InjectRepository(Position) private positionsRepo: Repository<Position>,
  ) {}

  getTrips(vehicleId: string) {
    return this.tripsRepo.find({
      where: { vehicleId, isComplete: true },
      order: { startedAt: 'DESC' },
      take: 50,
    });
  }

  getTripPositions(tripId: string) {
    return this.positionsRepo
      .createQueryBuilder('p')
      .innerJoin(
        Trip,
        't',
        't.id = :tripId AND p.vehicleId = t.vehicleId AND p.timestamp BETWEEN t.startedAt AND t.endedAt',
        { tripId },
      )
      .orderBy('p.timestamp', 'ASC')
      .getMany();
  }
}
