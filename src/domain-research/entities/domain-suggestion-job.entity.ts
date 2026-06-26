import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DomainCandidate } from './domain-candidate.entity';

@Entity('domain_suggestion_jobs')
export class DomainSuggestionJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  description!: string;

  @Column({ type: 'varchar', length: 16, default: 'en' })
  locale!: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  tlds!: string[];

  @Column({ type: 'varchar', length: 32, default: 'completed' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @OneToMany(() => DomainCandidate, (candidate) => candidate.job)
  candidates!: DomainCandidate[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
