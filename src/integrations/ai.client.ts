import { Injectable } from '@nestjs/common';

type AiCompleteResponse = {
  output?: string;
  content?: string;
  result?: unknown;
  text?: string;
};

@Injectable()
export class AiClient {
  async suggestDomainNames(description: string, count: number): Promise<string[]> {
    const baseUrl = process.env.AI_SERVICE_URL;
    if (!baseUrl) return [];
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/ai/complete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.AI_SERVICE_TOKEN ? { authorization: `Bearer ${process.env.AI_SERVICE_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        model_tier: process.env.AI_MODEL_TIER || 'cheap',
        system_prompt: 'Suggest short brandable domain second-level names. Return JSON array of lowercase ASCII strings only.',
        user_prompt: `Business or service description: ${description}\nReturn ${count} candidates.`,
        output_schema: { type: 'array', items: { type: 'string' } },
        agent_service_scope: 'domain-research',
        agent_slug: 'domain-suggestion',
      }),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as AiCompleteResponse;
    const raw = typeof payload.output === 'string'
      ? payload.output
      : typeof payload.content === 'string'
        ? payload.content
        : typeof payload.text === 'string'
          ? payload.text
          : JSON.stringify(payload.result || []);
    return this.extractCandidateNames(raw).slice(0, count);
  }

  private extractCandidateNames(raw: string): string[] {
    const values = this.parseStructuredValues(raw);
    const fallback = values.length ? values : raw.split(/[\n,]/);
    return Array.from(new Set(
      fallback
        .map((item) => this.normalizeCandidateName(item))
        .filter((item): item is string => Boolean(item)),
    ));
  }

  private parseStructuredValues(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
      if (parsed && typeof parsed === 'object') {
        return Object.values(parsed)
          .flatMap((value) => Array.isArray(value) ? value : [value])
          .filter((item): item is string => typeof item === 'string');
      }
      return [];
    } catch {
      return [];
    }
  }

  private normalizeCandidateName(value: string): string {
    const withoutProtocol = value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '');
    const firstToken = withoutProtocol.split(/\s+/)[0] || '';
    const sld = firstToken.includes('.') ? firstToken.split('.')[0] : firstToken;
    return sld.replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
  }
}
