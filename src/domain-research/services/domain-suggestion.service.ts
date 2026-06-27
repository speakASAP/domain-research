import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSuggestionDto } from '../dto/create-suggestion.dto';
import { DomainCandidate } from '../entities/domain-candidate.entity';
import { DomainSuggestionJob } from '../entities/domain-suggestion-job.entity';
import { AiClient } from '../../integrations/ai.client';

const SUPPORTED_TLDS = ['com', 'cz'];
const SUGGESTION_STOP_WORDS = new Set([
  'and',
  'for',
  'from',
  'service',
  'services',
  'that',
  'the',
  'this',
  'tool',
  'with',
]);

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

    const names = await this.generateNames(dto.description, dto.count || 15, dto.seedNames);
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

  private async generateNames(description: string, count: number, seedNames: string[] = []): Promise<string[]> {
    const aiNames = await this.ai.suggestDomainNames(description, count).catch(() => []);
    const seed = description
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .map((part) => part.replace(/[^a-z0-9-]/g, ''))
      .filter((part) => part.length > 1 && part.length < 14 && !SUGGESTION_STOP_WORDS.has(part))
      .slice(0, 4);
    const primary = seed[0] || 'domain';
    const secondary = seed.find((part) => part !== primary) || 'base';
    const heuristic = [
      `${primary}${secondary}`,
      `${primary}hub`,
      `${primary}ly`,
      `get${primary}`,
      `${primary}pilot`,
      `${secondary}base`,
      `${secondary}flow`,
    ];
    return this.normalizeCandidateNames([...this.normalizeSeedNames(seedNames), ...aiNames, ...heuristic])
      .slice(0, count);
  }

  private normalizeSeedNames(seedNames: string[]): string[] {
    return seedNames
      .flatMap((name) => String(name || '').split(/[,\s]+/))
      .map((name) => name.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0])
      .map((name) => name.split('.')[0])
      .map((name) => name.replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, ''))
      .filter(Boolean);
  }

  private normalizeCandidateNames(names: string[]): string[] {
    const normalized = names
      .map((name) => String(name || '').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, ''))
      .filter((name) => name.length >= 3 && name.length <= 24);
    return Array.from(new Set(normalized));
  }
}
