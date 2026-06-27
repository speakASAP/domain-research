import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { AvailabilityCheckDto } from './dto/availability-check.dto';
import { CreateWatchDto } from './dto/create-watch.dto';
import { UpdateWatchDto } from './dto/update-watch.dto';
import { DomainSuggestionService } from './services/domain-suggestion.service';
import { AvailabilityService } from './services/availability.service';
import { DomainWatchService } from './services/domain-watch.service';
import { SchedulerService } from './services/scheduler.service';
import { InternalServiceGuard } from '../service-identity/internal-service.guard';
import { AuthUserGuard } from '../auth/auth-user.guard';
import { CurrentAuthUser } from '../auth/current-auth-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';

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

  @UseGuards(AuthUserGuard)
  @Post('watches')
  createWatch(@Body() dto: CreateWatchDto, @CurrentAuthUser() user: AuthenticatedUser) {
    return this.watches.createWatch(dto, user);
  }

  @UseGuards(AuthUserGuard)
  @Get('watches')
  listWatches(@CurrentAuthUser() user: AuthenticatedUser) {
    return this.watches.listWatches(user.id);
  }

  @UseGuards(AuthUserGuard)
  @Post('watches/recheck')
  recheckWatches(@CurrentAuthUser() user: AuthenticatedUser) {
    return this.watches.recheckWatches(user.id);
  }

  @UseGuards(AuthUserGuard)
  @Patch('watches/:id')
  updateWatch(@Param('id') id: string, @Body() dto: UpdateWatchDto, @CurrentAuthUser() user: AuthenticatedUser) {
    return this.watches.updateWatch(id, user.id, dto);
  }

  @UseGuards(AuthUserGuard)
  @Delete('watches/:id')
  deleteWatch(@Param('id') id: string, @CurrentAuthUser() user: AuthenticatedUser) {
    return this.watches.deleteWatch(id, user.id);
  }

  @UseGuards(AuthUserGuard)
  @Get('watches/:id/history')
  watchHistory(@Param('id') id: string, @CurrentAuthUser() user: AuthenticatedUser) {
    return this.watches.watchHistory(id, user.id);
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
