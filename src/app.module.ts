import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { HealthController } from './health.controller';
import { DomainResearchModule } from './domain-research/domain-research.module';
import { DomainCandidate } from './domain-research/entities/domain-candidate.entity';
import { DomainCheck } from './domain-research/entities/domain-check.entity';
import { DomainNotification } from './domain-research/entities/domain-notification.entity';
import { DomainSuggestionJob } from './domain-research/entities/domain-suggestion-job.entity';
import { DomainWatch } from './domain-research/entities/domain-watch.entity';
import { LoggingModule } from './integrations/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db-server-postgres.statex-apps.svc.cluster.local',
      port: Number.parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'dbadmin',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'domain_research',
      entities: [DomainCandidate, DomainCheck, DomainNotification, DomainSuggestionJob, DomainWatch],
      synchronize: process.env.DB_SYNC === 'true',
      logging: process.env.DEBUG_SQL === 'true',
    }),
    LoggingModule,
    DomainResearchModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
