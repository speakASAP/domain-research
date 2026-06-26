import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('domain_watches')
export class DomainWatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  fqdn!: string;

  @Index()
  @Column({ type: 'varchar', length: 128, nullable: true })
  userId?: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true })
  notificationEmail?: string | null;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  nextCheckAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastCheckAt?: Date | null;

  @Column({ type: 'varchar', length: 32, default: 'unknown' })
  lastAvailability!: 'available' | 'registered' | 'unknown';

  @Column({ type: 'timestamptz', nullable: true })
  lastExpiresAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
