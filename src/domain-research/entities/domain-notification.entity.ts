import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('domain_notifications')
export class DomainNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  watchId!: string;

  @Column({ type: 'varchar', length: 64 })
  type!: 'domain_available' | 'domain_renewed' | 'check_failed';

  @Column({ type: 'varchar', length: 32, default: 'email' })
  channel!: string;

  @Column({ type: 'varchar', length: 320, nullable: true })
  recipientRef?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: 'pending' | 'sent' | 'failed';

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
