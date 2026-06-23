import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { FleetGateway } from './fleet.gateway';

const DEMO_VEHICLES = [
  { vehicleId: 'demo-1', name: 'Camion Casa 1', lat: 33.5893, lng: -7.6034 },
  { vehicleId: 'demo-2', name: 'Camion Casa 2', lat: 33.5731, lng: -7.5898 },
  { vehicleId: 'demo-3', name: 'Fourgon Nord', lat: 33.6054, lng: -7.5633 },
  { vehicleId: 'demo-4', name: 'Véhicule Port', lat: 33.5983, lng: -7.6289 },
  { vehicleId: 'demo-5', name: 'Livreur Sud', lat: 33.5412, lng: -7.6112 },
];

// Slightly randomised movement within Casablanca bounding box
function jitter(val: number, maxDelta: number): number {
  return val + (Math.random() - 0.5) * 2 * maxDelta;
}

@Injectable()
export class DemoService {
  private state = DEMO_VEHICLES.map((v) => ({
    ...v,
    speed: 0,
    heading: 0,
    ignition: true,
  }));

  constructor(private readonly gateway: FleetGateway) {}

  @Interval(10_000)
  broadcast(): void {
    const server = this.gateway.server;
    if (!server) return;

    this.state = this.state.map((v) => ({
      ...v,
      lat: Math.max(33.5, Math.min(33.65, jitter(v.lat, 0.003))),
      lng: Math.max(-7.7, Math.min(-7.5, jitter(v.lng, 0.003))),
      speed: Math.round(Math.random() * 80),
      heading: Math.round(Math.random() * 360),
    }));

    for (const v of this.state) {
      server.to('demo').emit('position', {
        vehicleId: v.vehicleId,
        imei: `DEMO${v.vehicleId.split('-')[1]}`,
        lat: v.lat,
        lng: v.lng,
        speed: v.speed,
        heading: v.heading,
        ignition: v.ignition,
        timestamp: new Date().toISOString(),
      });
    }
  }

  getInitialPositions() {
    return this.state.map((v) => ({
      vehicleId: v.vehicleId,
      imei: `DEMO${v.vehicleId.split('-')[1]}`,
      lat: v.lat,
      lng: v.lng,
      speed: v.speed,
      heading: v.heading,
      ignition: v.ignition,
      timestamp: new Date().toISOString(),
    }));
  }
}
