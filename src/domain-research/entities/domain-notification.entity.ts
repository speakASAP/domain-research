import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type DomainNotificationType =
  | 'domain_available'
  | 'drop_tracking_prompt'
  | 'drop_24h_warning'
  | 'drop_1h_warning'
  | 'domain_renewed'
  | 'check_failed';

@Entity('domain_notifications')
export class DomainNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'watch_id', type: 'uuid' })
  watchId!: string;

  @Column({ type: 'varchar', length: 64 })
  type!: DomainNotificationType;

  @Column({ name: 'dedupe_key', type: 'varchar', length: 160, nullable: true })
  dedupeKey?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'email' })
  channel!: string;

  @Column({ name: 'recipient_ref', type: 'varchar', length: 320, nullable: true })
  recipientRef?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: 'pending' | 'sent' | 'failed';

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  payload!: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
