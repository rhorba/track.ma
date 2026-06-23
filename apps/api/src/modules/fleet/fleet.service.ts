import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Position } from '../../entities/position.entity';
import { Vehicle } from '../../entities/vehicle.entity';
import { GpsPosition } from '@trackma/shared';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Position) private positionsRepo: Repository<Position>,
    @InjectRepository(Vehicle) private vehiclesRepo: Repository<Vehicle>,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async storePosition(pos: GpsPosition): Promise<Vehicle | null> {
    const vehicle = await this.vehiclesRepo.findOne({
      where: { imei: pos.imei },
    });
    if (!vehicle) return null;

    const position = this.positionsRepo.create({
      vehicleId: vehicle.id,
      lat: pos.lat,
      lng: pos.lng,
      speed: pos.speed,
      heading: pos.heading,
      altitude: pos.altitude,
      satellites: pos.satellites,
      ignition: pos.ignition,
      fuelLevel: pos.fuelLevel,
      odometer: pos.odometer,
      timestamp: pos.timestamp,
    });
    await this.positionsRepo.save(position);

    // Cache latest position
    await this.redis.set(
      `vehicle:${vehicle.id}:latest`,
      JSON.stringify({ ...pos, vehicleId: vehicle.id }),
      'EX',
      300,
    );

    // Update vehicle status
    const status = pos.ignition
      ? pos.speed > 0
        ? 'active'
        : 'idle'
      : 'offline';
    await this.vehiclesRepo.update(vehicle.id, { status });
    return vehicle;
  }

  async getLatestPositions(organizationId: string) {
    const vehicles = await this.vehiclesRepo.find({
      where: { organizationId, isActive: true },
    });
    const positions = await Promise.all(
      vehicles.map(async (v) => {
        const cached = await this.redis.get(`vehicle:${v.id}:latest`);
        return { vehicle: v, position: cached ? JSON.parse(cached) : null };
      }),
    );
    return positions;
  }

  getHistory(vehicleId: string, from: Date, to: Date) {
    return this.positionsRepo
      .createQueryBuilder('p')
      .where('p.vehicleId = :vehicleId', { vehicleId })
      .andWhere('p.timestamp BETWEEN :from AND :to', { from, to })
      .orderBy('p.timestamp', 'ASC')
      .getMany();
  }
}
