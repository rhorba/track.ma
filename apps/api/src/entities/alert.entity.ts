import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { AlertRule } from './alert-rule.entity';

@Entity('alerts')
@Index(['vehicleId', 'triggeredAt'])
@Index(['vehicleId', 'acknowledged'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vehicleId: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column()
  ruleId: string;

  @ManyToOne(() => AlertRule)
  @JoinColumn({ name: 'rule_id' })
  rule: AlertRule;

  @Column()
  type: string;

  @Column({
    type: 'enum',
    enum: ['info', 'warning', 'critical'],
    default: 'warning',
  })
  severity: string;

  @Column()
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown>;

  @Column({ default: false })
  acknowledged: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'timestamptz' })
  triggeredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
