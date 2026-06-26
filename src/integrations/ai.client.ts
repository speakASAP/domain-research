import { Injectable } from '@nestjs/common';

type AiCompleteResponse = {
  output?: string;
  content?: string;
  result?: unknown;
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
    const raw = typeof payload.output === 'string' ? payload.output : typeof payload.content === 'string' ? payload.content : JSON.stringify(payload.result || []);
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return raw.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
    }
  }
}
