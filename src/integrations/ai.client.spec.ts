import { AiClient } from './ai.client';

describe('AiClient', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, AI_SERVICE_URL: 'http://ai-service', AI_SERVICE_TOKEN: 'token' };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('extracts names from JSON arrays', async () => {
    let request: RequestInit | undefined;
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ text: '["brandpilot","domainflow"]' }),
    })) as jest.Mock;

    await expect(new AiClient().suggestDomainNames('test', 5)).resolves.toEqual(['brandpilot', 'domainflow']);
    request = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(JSON.parse(String(request?.body))).toMatchObject({ model_tier: 'smart' });
    expect(request?.signal).toBeDefined();
  });

  it('returns an empty list when the AI request rejects or times out', async () => {
    global.fetch = jest.fn(async () => {
      throw new DOMException('aborted', 'AbortError');
    }) as jest.Mock;

    await expect(new AiClient().suggestDomainNames('test', 5)).resolves.toEqual([]);
  });

  it('extracts second-level names from object values returned by small models', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        text: '{"domain1":"privacyfriendlycalendar.com","domain2":"reminder-hub.net","note":"ignored phrase"}',
      }),
    })) as jest.Mock;

    await expect(new AiClient().suggestDomainNames('test', 5)).resolves.toEqual([
      'privacyfriendlycalendar',
      'reminder-hub',
      'ignored',
    ]);
  });
});
