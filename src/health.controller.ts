import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health(): Record<string, string> {
    return {
      status: 'ok',
      service: process.env.SERVICE_NAME || 'domain-research',
      timestamp: new Date().toISOString(),
    };
  }
}
