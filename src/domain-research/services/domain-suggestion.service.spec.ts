import { DomainSuggestionService } from './domain-suggestion.service';

describe('DomainSuggestionService heuristics', () => {
  it('can be instantiated with mocked repositories', async () => {
    const saved: any[] = [];
    const jobs: any = {
      create: (input: any) => input,
      save: async (input: any) => ({ id: 'job-1', ...input }),
      findOne: async () => ({ id: 'job-1', candidates: saved }),
    };
    const candidates: any = {
      create: (input: any) => input,
      save: async (input: any[]) => saved.push(...input),
    };
    const ai: any = { suggestDomainNames: async () => ['brandpilot'] };
    const service = new DomainSuggestionService(jobs, candidates, ai);
    const result = await service.createSuggestion({ description: 'AI domain research tool', tlds: ['com'], count: 3 });
    expect(result.id).toBe('job-1');
    expect(saved.some((candidate) => candidate.fqdn === 'brandpilot.com')).toBe(true);
  });
});
