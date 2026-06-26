import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSuggestionDto } from '../dto/create-suggestion.dto';
import { DomainCandidate } from '../entities/domain-candidate.entity';
import { DomainSuggestionJob } from '../entities/domain-suggestion-job.entity';
import { AiClient } from '../../integrations/ai.client';

const SUPPORTED_TLDS = ['com', 'cz'];

@Injectable()
export class DomainSuggestionService {
  constructor(
    @InjectRepository(DomainSuggestionJob) private readonly jobs: Repository<DomainSuggestionJob>,
    @InjectRepository(DomainCandidate) private readonly candidates: Repository<DomainCandidate>,
    private readonly ai: AiClient,
  ) {}

  async createSuggestion(dto: CreateSuggestionDto): Promise<DomainSuggestionJob> {
    const tlds = this.normalizeTlds(dto.tlds);
    const job = await this.jobs.save(
      this.jobs.create({
        description: dto.description,
        locale: dto.locale || 'en',
        tlds,
        status: 'completed',
      }),
    );

    const names = await this.generateNames(dto.description, dto.count || 15);
    const rows = names.flatMap((name, index) =>
      tlds.map((tld) =>
        this.candidates.create({
          job,
          sld: name,
          tld,
          fqdn: `${name}.${tld}`,
          score: Math.max(1, 100 - index * 3),
          source: 'ai+heuristic',
        }),
      ),
    );
    await this.candidates.save(rows.slice(0, dto.count || 15));
    return this.getSuggestion(job.id);
  }

  async getSuggestion(id: string): Promise<DomainSuggestionJob> {
    const job = await this.jobs.findOne({ where: { id }, relations: ['candidates'] });
    if (!job) throw new Error(`Suggestion job not found: ${id}`);
    return job;
  }

  private normalizeTlds(input?: string[]): string[] {
    const fallback = (process.env.DEFAULT_TLDS || SUPPORTED_TLDS.join(',')).split(',');
    const tlds = Array.from(new Set((input?.length ? input : fallback)
      .map((tld) => tld.toLowerCase().replace(/^\./, '').trim())
      .filter((tld) => SUPPORTED_TLDS.includes(tld))));
    return tlds.length ? tlds : SUPPORTED_TLDS;
  }

  private async generateNames(description: string, count: number): Promise<string[]> {
    const aiNames = await this.ai.suggestDomainNames(description, count).catch(() => []);
    const seed = description
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((part) => part.length > 2 && part.length < 16)
      .slice(0, 8);
    const heuristic = [
      seed.join(''),
      `${seed[0] || 'domain'}hub`,
      `${seed[0] || 'domain'}ly`,
      `get${seed[0] || 'domain'}`,
      `${seed[0] || 'domain'}pilot`,
      `${seed[0] || 'domain'}base`,
      `${seed[0] || 'domain'}flow`,
    ];
    return Array.from(new Set([...aiNames, ...heuristic]))
      .map((name) => name.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, ''))
      .filter((name) => name.length >= 3 && name.length <= 63)
      .slice(0, count);
  }
}
