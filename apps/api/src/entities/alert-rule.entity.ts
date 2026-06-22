import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { Vehicle } from './vehicle.entity';

export type AlertRuleType = 'speeding' | 'geofence_enter' | 'geofence_exit' | 'ignition_on' | 'ignition_off' | 'low_fuel' | 'offline';

@Entity('alert_rules')
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['speeding', 'geofence_enter', 'geofence_exit', 'ignition_on', 'ignition_off', 'low_fuel', 'offline'] })
  type: AlertRuleType;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, unknown>; // { speedLimit: 120 } | { geofenceId: 'uuid' } | { fuelThreshold: 10 }

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  notifyByEmail: boolean;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ nullable: true })
  vehicleId: string; // null = applies to all vehicles in org

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @CreateDateColumn()
  createdAt: Date;
}
