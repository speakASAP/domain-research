import { createHash } from 'crypto';
import { Socket } from 'net';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainCheck } from '../entities/domain-check.entity';

type RdapBootstrap = {
  services: [string[], string[]][];
};

type WhoisAvailability = 'available' | 'registered' | 'unknown';

type WhoisResult = {
  availability: WhoisAvailability;
  confidence: 'low' | 'medium';
  text: string;
  error?: string;
};

const WHOIS_TIMEOUT_MS = Number.parseInt(process.env.WHOIS_TIMEOUT_MS || '5000', 10);
const IANA_WHOIS_SERVER = process.env.IANA_WHOIS_SERVER || 'whois.iana.org';

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
        return this.checkWithWhoisFallback(fqdn, 'RDAP endpoint not found');
      }
      const url = `${baseUrl.replace(/\/$/, '')}/domain/${encodeURIComponent(fqdn)}`;
      const response = await fetch(url, { headers: { accept: 'application/rdap+json, application/json' } });
      if (response.status === 404) {
        return this.persistCheck({ fqdn, availability: 'available', confidence: 'medium' });
      }
      const text = await response.text();
      if (!response.ok) {
        return this.checkWithWhoisFallback(fqdn, `RDAP HTTP ${response.status}`, sha256(text));
      }
      const payload = JSON.parse(text) as Record<string, unknown>;
      return this.persistCheck({
        fqdn,
        availability: 'registered',
        confidence: 'high',
        registrar: extractRegistrar(payload),
        expiresAt: extractExpiry(payload),
        nameservers: extractNameservers(payload),
        registryStatuses: extractRegistryStatuses(payload),
        rawHash: sha256(text),
      });
    } catch (error) {
      return this.checkWithWhoisFallback(fqdn, error instanceof Error ? error.message : String(error));
    }
  }

  private async checkWithWhoisFallback(fqdn: string, rdapError: string, rdapRawHash?: string): Promise<DomainCheck> {
    if (process.env.WHOIS_FALLBACK_DISABLED === 'true') {
      return this.persistCheck({ fqdn, availability: 'unknown', confidence: 'low', error: rdapError, rawHash: rdapRawHash });
    }

    const whois = await this.lookupWhois(fqdn);
    if (whois.availability === 'unknown') {
      return this.persistCheck({
        fqdn,
        availability: 'unknown',
        confidence: 'low',
        error: [rdapError, whois.error || 'WHOIS did not return a definitive availability marker'].join('; '),
        rawHash: whois.text ? sha256(whois.text) : rdapRawHash,
      });
    }

    return this.persistCheck({
      fqdn,
      provider: 'whois',
      availability: whois.availability,
      confidence: whois.confidence,
      rawHash: sha256(whois.text),
      error: `RDAP fallback used: ${rdapError}`,
    });
  }

  private async lookupWhois(fqdn: string): Promise<WhoisResult> {
    try {
      const tld = fqdn.split('.').pop()?.toLowerCase();
      if (!tld) return { availability: 'unknown', confidence: 'low', text: '', error: 'WHOIS TLD not found' };

      const ianaText = await queryWhoisServer(IANA_WHOIS_SERVER, tld);
      const referral = parseWhoisReferral(ianaText);
      if (!referral) {
        return { availability: 'unknown', confidence: 'low', text: ianaText, error: 'WHOIS referral not found' };
      }

      const registryText = await queryWhoisServer(referral, fqdn);
      const availability = classifyWhoisAvailability(registryText);
      return {
        availability,
        confidence: availability === 'unknown' ? 'low' : 'medium',
        text: registryText,
      };
    } catch (error) {
      return {
        availability: 'unknown',
        confidence: 'low',
        text: '',
        error: `WHOIS ${error instanceof Error ? error.message : String(error)}`,
      };
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


function extractRegistryStatuses(payload: Record<string, unknown>): string[] {
  const statuses = Array.isArray(payload.status) ? payload.status : [];
  return Array.from(new Set(statuses
    .map((item) => String(item).toLowerCase().replace(/[ _]+/g, '-').trim())
    .filter(Boolean)
    .sort()));
}

export function parseWhoisReferral(text: string): string | null {
  const match = text.match(/^whois:\s*(\S+)/im);
  return match?.[1]?.toLowerCase() || null;
}

export function classifyWhoisAvailability(text: string): WhoisAvailability {
  const normalized = text.toLowerCase();
  const unavailableMarkers = [
    /\bno match(?: for)?\b/,
    /\bnot found\b/,
    /\bno data found\b/,
    /\bno entries found\b/,
    /\bno object found\b/,
    /\bdomain not found\b/,
    /\bnot registered\b/,
    /\bavailable for registration\b/,
    /\bstatus:\s*free\b/,
    /\bis free\b/,
  ];
  if (unavailableMarkers.some((pattern) => pattern.test(normalized))) return 'available';

  const registeredMarkers = [
    /^domain name:\s*\S+/im,
    /^registrar:\s*\S+/im,
    /^creation date:\s*\S+/im,
    /^created:\s*\S+/im,
    /^registered on:\s*\S+/im,
    /^name server:\s*\S+/im,
    /^nserver:\s*\S+/im,
    /^state:\s*registered\b/im,
  ];
  if (registeredMarkers.some((pattern) => pattern.test(text))) return 'registered';

  return 'unknown';
}

function queryWhoisServer(server: string, query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const chunks: Buffer[] = [];
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve(Buffer.concat(chunks).toString('utf8'));
    };

    socket.setTimeout(WHOIS_TIMEOUT_MS);
    socket.once('timeout', () => finish(new Error(`timeout from ${server}`)));
    socket.once('error', finish);
    socket.on('data', (chunk: Buffer) => chunks.push(chunk));
    socket.once('end', () => finish());
    socket.connect(43, server, () => socket.write(`${query}\r\n`));
  });
}
