import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { AvailabilityCheckDto } from './dto/availability-check.dto';
import { CreateWatchDto } from './dto/create-watch.dto';
import { UpdateWatchDto } from './dto/update-watch.dto';
import { DomainSuggestionService } from './services/domain-suggestion.service';
import { AvailabilityService } from './services/availability.service';
import { DomainWatchService } from './services/domain-watch.service';
import { SchedulerService } from './services/scheduler.service';
import { InternalServiceGuard } from '../service-identity/internal-service.guard';

@Controller()
export class DomainResearchController {
  constructor(
    private readonly suggestions: DomainSuggestionService,
    private readonly availability: AvailabilityService,
    private readonly watches: DomainWatchService,
    private readonly scheduler: SchedulerService,
  ) {}

  @Post('domain-suggestions')
  createSuggestion(@Body() dto: CreateSuggestionDto) {
    return this.suggestions.createSuggestion(dto);
  }

  @Get('domain-suggestions/:id')
  getSuggestion(@Param('id') id: string) {
    return this.suggestions.getSuggestion(id);
  }

  @Post('availability/check')
  checkAvailability(@Body() dto: AvailabilityCheckDto) {
    return this.availability.checkMany(dto.domains);
  }

  @Post('watches')
  createWatch(@Body() dto: CreateWatchDto) {
    return this.watches.createWatch(dto);
  }

  @Get('watches')
  listWatches(@Query('userId') userId?: string) {
    return this.watches.listWatches(userId);
  }

  @Patch('watches/:id')
  updateWatch(@Param('id') id: string, @Body() dto: UpdateWatchDto) {
    return this.watches.updateWatch(id, dto);
  }

  @Get('watches/:id/history')
  watchHistory(@Param('id') id: string) {
    return this.watches.watchHistory(id);
  }

  @UseGuards(InternalServiceGuard)
  @Post('internal/jobs/expiry-recheck/run-due')
  runDueChecks(@Body('limit') limit?: number) {
    return this.scheduler.runDueExpiryChecks(Number(limit || 50));
  }

  @UseGuards(InternalServiceGuard)
  @Post('internal/jobs/notification-dispatch/run-due')
  runDueNotifications(@Body('limit') limit?: number) {
    return this.scheduler.runDueNotifications(Number(limit || 50));
  }
}
