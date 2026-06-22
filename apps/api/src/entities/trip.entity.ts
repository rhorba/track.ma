import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vehicleId: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date;

  @Column({ type: 'double precision' })
  startLat: number;

  @Column({ type: 'double precision' })
  startLng: number;

  @Column({ type: 'double precision', nullable: true })
  endLat: number;

  @Column({ type: 'double precision', nullable: true })
  endLng: number;

  @Column({ type: 'float', default: 0 })
  distanceKm: number;

  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ type: 'float', default: 0 })
  maxSpeedKmh: number;

  @Column({ type: 'float', default: 0 })
  avgSpeedKmh: number;

  @Column({ type: 'float', nullable: true })
  fuelConsumedL: number;

  @Column({ default: false })
  isComplete: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
