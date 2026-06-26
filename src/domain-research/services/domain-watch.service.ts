import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWatchDto } from '../dto/create-watch.dto';
import { UpdateWatchDto } from '../dto/update-watch.dto';
import { DomainCheck } from '../entities/domain-check.entity';
import { DomainWatch } from '../entities/domain-watch.entity';
import { AvailabilityService } from './availability.service';

@Injectable()
export class DomainWatchService {
  constructor(
    @InjectRepository(DomainWatch) private readonly watches: Repository<DomainWatch>,
    @InjectRepository(DomainCheck) private readonly checks: Repository<DomainCheck>,
    private readonly availability: AvailabilityService,
  ) {}

  async createWatch(dto: CreateWatchDto): Promise<DomainWatch> {
    const check = await this.availability.checkOne(dto.fqdn);
    return this.watches.save(
      this.watches.create({
        fqdn: check.fqdn,
        userId: dto.userId || null,
        notificationEmail: dto.notificationEmail || null,
        enabled: dto.enabled ?? true,
        lastAvailability: check.availability,
        lastExpiresAt: check.expiresAt || null,
        lastCheckAt: new Date(),
        nextCheckAt: nextCheckDate(check.expiresAt || null),
      }),
    );
  }

  listWatches(userId?: string): Promise<DomainWatch[]> {
    return this.watches.find({
      where: userId ? { userId } : {},
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async updateWatch(id: string, dto: UpdateWatchDto): Promise<DomainWatch> {
    const watch = await this.watches.findOneByOrFail({ id });
    if (dto.enabled !== undefined) watch.enabled = dto.enabled;
    if (dto.notificationEmail !== undefined) watch.notificationEmail = dto.notificationEmail;
    return this.watches.save(watch);
  }

  async watchHistory(id: string): Promise<{ watch: DomainWatch; checks: DomainCheck[] }> {
    const watch = await this.watches.findOneByOrFail({ id });
    const checks = await this.checks.find({ where: { fqdn: watch.fqdn }, order: { checkedAt: 'DESC' }, take: 100 });
    return { watch, checks };
  }
}

export function nextCheckDate(expiresAt: Date | null): Date {
  if (!expiresAt) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  const next = new Date(expiresAt);
  next.setUTCHours(8, 0, 0, 0);
  return next;
}
