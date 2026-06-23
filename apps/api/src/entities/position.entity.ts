import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity('positions')
@Index(['vehicleId', 'timestamp'])
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  vehicleId: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Column({ type: 'float', default: 0 })
  speed: number;

  @Column({ type: 'float', default: 0 })
  heading: number;

  @Column({ type: 'float', default: 0 })
  altitude: number;

  @Column({ default: 0 })
  satellites: number;

  @Column({ default: false })
  ignition: boolean;

  @Column({ type: 'float', nullable: true })
  fuelLevel: number;

  @Column({ type: 'bigint', nullable: true })
  odometer: number;

  @Column({ type: 'timestamptz' })
  @Index()
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}
