import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('domain_checks')
export class DomainCheck {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  fqdn!: string;

  @Column({ type: 'varchar', length: 64, default: 'rdap' })
  provider!: string;

  @Column({ type: 'varchar', length: 32 })
  availability!: 'available' | 'registered' | 'unknown';

  @Column({ type: 'varchar', length: 32, default: 'medium' })
  confidence!: 'low' | 'medium' | 'high';

  @Column({ type: 'varchar', length: 255, nullable: true })
  registrar?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  nameservers!: string[];

  @Column({ type: 'varchar', length: 128, nullable: true })
  rawHash?: string | null;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @CreateDateColumn()
  checkedAt!: Date;
}
