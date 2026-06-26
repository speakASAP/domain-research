import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../auth/auth.types';
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

  async createWatch(dto: CreateWatchDto, user: AuthenticatedUser): Promise<DomainWatch> {
    const notificationEmail = normalizeEmail(user.email);
    if (!notificationEmail) {
      throw new BadRequestException('Authenticated user email required');
    }

    const check = await this.availability.checkOne(dto.fqdn);
    return this.watches.save(
      this.watches.create({
        fqdn: check.fqdn,
        userId: user.id,
        notificationEmail,
        enabled: dto.enabled ?? true,
        lastAvailability: check.availability,
        lastExpiresAt: check.expiresAt || null,
        lastCheckAt: new Date(),
        nextCheckAt: nextCheckDate(check.expiresAt || null),
      }),
    );
  }

  listWatches(userId: string): Promise<DomainWatch[]> {
    return this.watches.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async updateWatch(id: string, userId: string, dto: UpdateWatchDto): Promise<DomainWatch> {
    const watch = await this.watches.findOneByOrFail({ id, userId });
    if (dto.enabled !== undefined) watch.enabled = dto.enabled;
    return this.watches.save(watch);
  }

  async watchHistory(id: string, userId: string): Promise<{ watch: DomainWatch; checks: DomainCheck[] }> {
    const watch = await this.watches.findOneByOrFail({ id, userId });
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

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
