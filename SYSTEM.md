# System Design

## System Boundary

Domain Research owns:

- domain suggestion jobs;
- candidate domain records;
- RDAP/provider availability checks;
- watched domain lifecycle state;
- scheduled expiry rechecks;
- notification dispatch records;
- product UI for the workflow.

Domain Research does not own:

- identity provider behavior;
- notification delivery infrastructure;
- LLM provider keys;
- docs-rag indexing infrastructure;
- registrar account ownership.

## Modules

- `DomainSuggestionModule`: user description -> candidate domain names.
- `AvailabilityModule`: RDAP-first domain checks and lifecycle evidence.
- `DomainWatchModule`: user-owned watches and observation history.
- `SchedulerModule`: CronJob-triggered due checks and notification dispatch.
- `NotificationModule`: notifications-microservice client.
- `AiClient`: ai-microservice client.

## Persistence

PostgreSQL database: `[ASSUMPTION: domain_research]`.

Tables:

- `domain_suggestion_jobs`
- `domain_candidates`
- `domain_checks`
- `domain_watches`
- `domain_notifications`

## External Integrations

- `ai-microservice`: candidate expansion through `POST /ai/complete`.
- `notifications-microservice`: email/Telegram/WhatsApp delivery through `/notifications/send`.
- `logging-microservice`: structured logs through `/api/logs`.
- `auth-microservice`: validates browser bearer tokens through `POST /auth/validate` for user-owned watch endpoints. `[MISSING: final hosted Auth role/client registration]`.
- `docs-rag-microservice`: ingest markdown docs after repo registration.

## Security

- Secrets in Vault only.
- Internal job endpoints require JWT signed with `JWT_SECRET`.
- Raw RDAP response bodies are hashed, not persisted.
- Notification recipients are stored as bounded references only.
