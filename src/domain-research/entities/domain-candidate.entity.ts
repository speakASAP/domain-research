import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DomainSuggestionJob } from './domain-suggestion-job.entity';

@Entity('domain_candidates')
export class DomainCandidate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => DomainSuggestionJob, (job) => job.candidates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job!: DomainSuggestionJob;

  @Column({ type: 'varchar', length: 255 })
  fqdn!: string;

  @Column({ type: 'varchar', length: 128 })
  sld!: string;

  @Column({ type: 'varchar', length: 32 })
  tld!: string;

  @Column({ type: 'float', default: 0 })
  score!: number;

  @Column({ type: 'varchar', length: 32, default: 'heuristic' })
  source!: string;

  @Column({ type: 'varchar', length: 32, default: 'unchecked' })
  availability!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
