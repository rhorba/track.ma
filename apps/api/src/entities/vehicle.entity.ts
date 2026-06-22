import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';

export type VehicleType = 'car' | 'truck' | 'van' | 'motorcycle' | 'boat' | 'scooter';
export type VehicleStatus = 'active' | 'idle' | 'offline' | 'maintenance';

@Entity('vehicles')
@Index(['organizationId', 'isActive'])
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  plate: string;

  @Column({ type: 'enum', enum: ['car', 'truck', 'van', 'motorcycle', 'boat', 'scooter'], default: 'car' })
  type: VehicleType;

  @Column({ type: 'enum', enum: ['active', 'idle', 'offline', 'maintenance'], default: 'offline' })
  status: VehicleStatus;

  @Column({ unique: true, nullable: true })
  imei: string;

  @Column({ nullable: true })
  driverName: string;

  @Column({ type: 'float', nullable: true })
  fuelConsumptionRate: number; // L/100km for calculation fallback

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Organization, (org) => org.vehicles)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
