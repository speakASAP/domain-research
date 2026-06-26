import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainResearchController } from './domain-research.controller';
import { AvailabilityService } from './services/availability.service';
import { DomainSuggestionService } from './services/domain-suggestion.service';
import { DomainWatchService } from './services/domain-watch.service';
import { SchedulerService } from './services/scheduler.service';
import { AiClient } from '../integrations/ai.client';
import { NotificationClient } from '../integrations/notification.client';
import { DomainCandidate } from './entities/domain-candidate.entity';
import { DomainCheck } from './entities/domain-check.entity';
import { DomainNotification } from './entities/domain-notification.entity';
import { DomainSuggestionJob } from './entities/domain-suggestion-job.entity';
import { DomainWatch } from './entities/domain-watch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DomainCandidate, DomainCheck, DomainNotification, DomainSuggestionJob, DomainWatch]),
  ],
  controllers: [DomainResearchController],
  providers: [AiClient, NotificationClient, AvailabilityService, DomainSuggestionService, DomainWatchService, SchedulerService],
})
export class DomainResearchModule {}
