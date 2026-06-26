import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggingService {
  async log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta: Record<string, unknown> = {}): Promise<void> {
    const baseUrl = process.env.LOGGING_SERVICE_URL;
    if (!baseUrl) return;
    fetch(`${baseUrl.replace(/\/$/, '')}${process.env.LOGGING_SERVICE_API_PATH || '/api/logs'}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        service: process.env.SERVICE_NAME || 'domain-research',
        level,
        msg: message,
        timestamp: new Date().toISOString(),
        ...meta,
      }),
    }).catch(() => undefined);
  }
}
