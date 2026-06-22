import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../../entities/trip.entity';
import { GpsPosition } from '@trackma/shared';
import { haversineKm } from '../../utils/geo.util';

interface OpenTrip {
  trip: Trip;
  lastLat: number;
  lastLng: number;
  speedSum: number;
  speedCount: number;
}

@Injectable()
export class TripDetectorService {
  private readonly logger = new Logger(TripDetectorService.name);
  private readonly openTrips = new Map<string, OpenTrip>();

  constructor(
    @InjectRepository(Trip) private tripsRepo: Repository<Trip>,
  ) {}

  async process(pos: GpsPosition, vehicleId: string): Promise<void> {
    const open = this.openTrips.get(vehicleId);

    if (pos.ignition && !open) {
      await this.openTrip(pos, vehicleId);
    } else if (pos.ignition && open) {
      this.accumulate(open, pos);
    } else if (!pos.ignition && open) {
      await this.closeTrip(open, pos, vehicleId);
    }
  }

  private async openTrip(pos: GpsPosition, vehicleId: string): Promise<void> {
    const trip = await this.tripsRepo.save(
      this.tripsRepo.create({
        vehicleId,
        startedAt: pos.timestamp,
        startLat: pos.lat,
        startLng: pos.lng,
        distanceKm: 0,
        durationSeconds: 0,
        maxSpeedKmh: pos.speed,
        avgSpeedKmh: pos.speed,
        isComplete: false,
      }),
    );
    this.openTrips.set(vehicleId, {
      trip,
      lastLat: pos.lat,
      lastLng: pos.lng,
      speedSum: pos.speed,
      speedCount: 1,
    });
    this.logger.log(`Trip opened for vehicle ${vehicleId}`);
  }

  private accumulate(open: OpenTrip, pos: GpsPosition): void {
    const segKm = haversineKm(
      { lat: open.lastLat, lng: open.lastLng },
      { lat: pos.lat, lng: pos.lng },
    );
    open.trip.distanceKm += segKm;
    open.trip.maxSpeedKmh = Math.max(open.trip.maxSpeedKmh, pos.speed);
    open.speedSum += pos.speed;
    open.speedCount += 1;
    open.lastLat = pos.lat;
    open.lastLng = pos.lng;
  }

  private async closeTrip(open: OpenTrip, pos: GpsPosition, vehicleId: string): Promise<void> {
    const trip = open.trip;
    trip.endedAt = pos.timestamp;
    trip.endLat = pos.lat;
    trip.endLng = pos.lng;
    trip.durationSeconds = Math.round(
      (pos.timestamp.getTime() - trip.startedAt.getTime()) / 1000,
    );
    trip.avgSpeedKmh = open.speedCount > 0 ? open.speedSum / open.speedCount : 0;
    trip.isComplete = true;
    await this.tripsRepo.save(trip);
    this.openTrips.delete(vehicleId);
    this.logger.log(`Trip closed for vehicle ${vehicleId} — ${trip.distanceKm.toFixed(2)} km`);
  }
}
