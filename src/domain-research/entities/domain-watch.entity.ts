import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DomainLifecycleStage = 'active' | 'expired' | 'redemption' | 'pending_delete' | 'drop_imminent' | 'available' | 'unknown';
export type DropTrackingConsent = 'pending' | 'accepted' | 'declined';

@Entity('domain_watches')
export class DomainWatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  fqdn!: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar', length: 128, nullable: true })
  userId?: string | null;

  @Column({ name: 'notification_email', type: 'varchar', length: 320, nullable: true })
  notificationEmail?: string | null;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ name: 'drop_tracking_consent', type: 'varchar', length: 32, default: 'pending' })
  dropTrackingConsent!: DropTrackingConsent;

  @Column({ name: 'lifecycle_stage', type: 'varchar', length: 32, default: 'unknown' })
  lifecycleStage!: DomainLifecycleStage;

  @Column({ name: 'drop_candidate_at', type: 'timestamptz', nullable: true })
  dropCandidateAt?: Date | null;

  @Column({ name: 'last_registry_statuses', type: 'jsonb', default: () => "'[]'::jsonb" })
  lastRegistryStatuses!: string[];

  @Index()
  @Column({ name: 'next_check_at', type: 'timestamptz', nullable: true })
  nextCheckAt?: Date | null;

  @Column({ name: 'last_check_at', type: 'timestamptz', nullable: true })
  lastCheckAt?: Date | null;

  @Column({ name: 'last_availability', type: 'varchar', length: 32, default: 'unknown' })
  lastAvailability!: 'available' | 'registered' | 'unknown';

  @Column({ name: 'last_expires_at', type: 'timestamptz', nullable: true })
  lastExpiresAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
