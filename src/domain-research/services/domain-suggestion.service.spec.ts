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

  it('only keeps com and cz TLDs', async () => {
    const saved: any[] = [];
    let savedJob: any;
    const jobs: any = {
      create: (input: any) => input,
      save: async (input: any) => {
        savedJob = { id: 'job-1', ...input };
        return savedJob;
      },
      findOne: async () => ({ ...savedJob, candidates: saved }),
    };
    const candidates: any = {
      create: (input: any) => input,
      save: async (input: any[]) => saved.push(...input),
    };
    const ai: any = { suggestDomainNames: async () => ['brandpilot'] };
    const service = new DomainSuggestionService(jobs, candidates, ai);

    const result = await service.createSuggestion({ description: 'AI domain research tool', tlds: ['com', 'cz', 'ai', 'io'], count: 4 });

    expect(result.tlds).toEqual(['com', 'cz']);
    expect(new Set(saved.map((candidate) => candidate.tld))).toEqual(new Set(['com', 'cz']));
  });

  it('does not turn whole descriptions into long fallback domains', async () => {
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
    const ai: any = { suggestDomainNames: async () => [] };
    const service = new DomainSuggestionService(jobs, candidates, ai);

    await service.createSuggestion({
      description: 'AI service for restaurant booking and customer reminders',
      tlds: ['com'],
      count: 5,
    });

    expect(saved.map((candidate) => candidate.sld)).not.toContain('serviceforrestaurantbookingandcustomerreminders');
    expect(saved.every((candidate) => candidate.sld.length <= 24)).toBe(true);
    expect(saved.map((candidate) => candidate.fqdn)).toContain('airestaurant.com');
  });

  it('uses provided seed names before generated fallback names', async () => {
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
    const ai: any = { suggestDomainNames: async () => [] };
    const service = new DomainSuggestionService(jobs, candidates, ai);

    await service.createSuggestion({
      description: 'Testing product names',
      seedNames: ['testhub', 'gettest', 'testpilot'],
      tlds: ['com', 'cz'],
      count: 6,
    });

    expect(saved.map((candidate) => candidate.fqdn)).toEqual([
      'testhub.com',
      'testhub.cz',
      'gettest.com',
      'gettest.cz',
      'testpilot.com',
      'testpilot.cz',
    ]);
  });
});
