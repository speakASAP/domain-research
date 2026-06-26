import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainCheck } from '../entities/domain-check.entity';

type RdapBootstrap = {
  services: [string[], string[]][];
};

@Injectable()
export class AvailabilityService {
  private bootstrap?: { loadedAt: number; data: RdapBootstrap };

  constructor(@InjectRepository(DomainCheck) private readonly checks: Repository<DomainCheck>) {}

  async checkMany(domains: string[]): Promise<{ results: DomainCheck[] }> {
    const results: DomainCheck[] = [];
    for (const domain of domains) {
      results.push(await this.checkOne(domain));
    }
    return { results };
  }

  async checkOne(input: string): Promise<DomainCheck> {
    const fqdn = normalizeDomain(input);
    try {
      const baseUrl = await this.rdapBaseUrl(fqdn);
      if (!baseUrl) {
        return this.persistCheck({ fqdn, availability: 'unknown', confidence: 'low', error: 'RDAP endpoint not found' });
      }
      const url = `${baseUrl.replace(/\/$/, '')}/domain/${encodeURIComponent(fqdn)}`;
      const response = await fetch(url, { headers: { accept: 'application/rdap+json, application/json' } });
      if (response.status === 404) {
        return this.persistCheck({ fqdn, availability: 'available', confidence: 'medium' });
      }
      const text = await response.text();
      if (!response.ok) {
        return this.persistCheck({
          fqdn,
          availability: 'unknown',
          confidence: 'low',
          error: `RDAP HTTP ${response.status}`,
          rawHash: sha256(text),
        });
      }
      const payload = JSON.parse(text) as Record<string, unknown>;
      return this.persistCheck({
        fqdn,
        availability: 'registered',
        confidence: 'high',
        registrar: extractRegistrar(payload),
        expiresAt: extractExpiry(payload),
        nameservers: extractNameservers(payload),
        rawHash: sha256(text),
      });
    } catch (error) {
      return this.persistCheck({
        fqdn,
        availability: 'unknown',
        confidence: 'low',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async rdapBaseUrl(fqdn: string): Promise<string | undefined> {
    const bootstrapUrl = process.env.RDAP_BOOTSTRAP_URL || 'https://data.iana.org/rdap/dns.json';
    const now = Date.now();
    if (!this.bootstrap || now - this.bootstrap.loadedAt > 24 * 60 * 60 * 1000) {
      const response = await fetch(bootstrapUrl);
      this.bootstrap = { loadedAt: now, data: (await response.json()) as RdapBootstrap };
    }
    const tld = fqdn.split('.').pop()?.toLowerCase();
    const match = this.bootstrap.data.services.find(([tlds]) => tlds.map((item) => item.toLowerCase()).includes(tld || ''));
    return match?.[1]?.[0];
  }

  private persistCheck(input: Partial<DomainCheck> & Pick<DomainCheck, 'fqdn' | 'availability' | 'confidence'>): Promise<DomainCheck> {
    return this.checks.save(this.checks.create({ provider: 'rdap', nameservers: [], ...input }));
  }
}

function normalizeDomain(input: string): string {
  return input.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].replace(/^\.+|\.+$/g, '').trim();
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function extractExpiry(payload: Record<string, unknown>): Date | null {
  const events = Array.isArray(payload.events) ? (payload.events as Record<string, unknown>[]) : [];
  const event = events.find((item) => String(item.eventAction || '').toLowerCase().includes('expir'));
  const date = typeof event?.eventDate === 'string' ? new Date(event.eventDate) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function extractRegistrar(payload: Record<string, unknown>): string | null {
  const entities = Array.isArray(payload.entities) ? (payload.entities as Record<string, unknown>[]) : [];
  const registrar = entities.find((entity) => Array.isArray(entity.roles) && (entity.roles as string[]).includes('registrar'));
  const vcard = Array.isArray(registrar?.vcardArray) ? registrar?.vcardArray : undefined;
  const entries = Array.isArray(vcard?.[1]) ? (vcard?.[1] as unknown[]) : [];
  const fn = entries.find((entry) => Array.isArray(entry) && entry[0] === 'fn') as unknown[] | undefined;
  return typeof fn?.[3] === 'string' ? fn[3] : null;
}

function extractNameservers(payload: Record<string, unknown>): string[] {
  const nameservers = Array.isArray(payload.nameservers) ? (payload.nameservers as Record<string, unknown>[]) : [];
  return nameservers
    .map((item) => (typeof item.ldhName === 'string' ? item.ldhName.toLowerCase() : undefined))
    .filter((item): item is string => Boolean(item));
}
