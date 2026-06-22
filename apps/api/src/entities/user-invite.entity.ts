import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';

@Entity('user_invites')
@Index(['email', 'organizationId'], { where: '"is_active" = true' })
@Index(['organizationId', 'isActive'])
export class UserInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column()
  email: string;

  @Column()
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  invitedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedBy: User;

  @Column({ type: 'enum', enum: ['org_admin', 'fleet_manager', 'viewer', 'driver'], default: 'viewer' })
  role: string;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
