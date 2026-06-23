import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';

export type SubscriptionTier = 'starter' | 'pro' | 'business' | 'trial';
export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'trialing';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: ['starter', 'pro', 'business', 'trial'],
    default: 'trial',
  })
  tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: ['active', 'cancelled', 'past_due', 'trialing'],
    default: 'trialing',
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ default: 2 })
  vehicleLimit: number;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.organization)
  vehicles: Vehicle[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
