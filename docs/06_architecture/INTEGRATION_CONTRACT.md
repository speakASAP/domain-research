# Integration contract

## Purpose
This contract defines the real Domain Research runtime boundary: it generates candidate domains, checks availability through RDAP-first evidence, manages user-owned watches, and dispatches notifications through the approved notifications boundary without claiming ownership of identity or payment infrastructure.

## Capability decisions
- auth: required — The service validates bearer tokens for authenticated watch endpoints and user-owned domain watch APIs.
- postgres: required — PostgreSQL stores suggestion jobs, candidates, checks, watches, and notification metadata.
- redis: not-applicable — No Redis runtime is required.
- logging: required — Structured logs and operational evidence pass through the platform logging service.
- notifications: required — Notification dispatch is handled via notifications-microservice after valid watch rechecks.
- ai: required — The service uses ai-microservice to suggest candidate domain names from service context.
- payments: not-applicable — The repo does not manage payment processing or purchase flows.
- catalog: not-applicable — Domain Research does not own product catalog state.
- orders: not-applicable — The repo is not part of the orders domain.
- warehouse: not-applicable — Inventory and stock state do not live here.
- invoices: not-applicable — No invoice operations are managed by this repo.
- object-storage: not-applicable — No object-storage runtime is required.
- event-bus: not-applicable — The current workflow does not rely on a shared event-bus contract owned by this repo.
- docs-rag: required — The repo should remain part of the docs and search ecosystem for service discovery and project context.
- monitoring: required — Health and deployment readiness are exposed for platform monitoring.
- backups: required — The service’s Postgres state belongs in the platform backup scope.

## Data ownership
The repo owns domain suggestions, watch records, availability-check evidence, and notification metadata. It does not own user identity, billing, or registrar purchase state.

## Authentication and authorization
Auth ownership remains with auth-microservice and endpoint validation happens through bearer-token checks for authenticated watch workflows. The repo does not manage identity infrastructure or final auth roles.

## Synchronous dependencies
- ai-microservice for domain suggestion generation
- auth-microservice for bearer-token validation
- notifications-microservice for dispatching user-facing alerts
- logging-microservice for structured logs
- db-server-postgres for operational state

## Asynchronous dependencies
- Scheduled expiry rechecks and domain watch evaluation happen through repository-owned internal job APIs and cron-driven execution.
- Notification dispatch is an external contract rather than a custom sender implementation in this repo.

## Degraded operation
If the service has degraded availability or provider access, the domain workflow may pause or reduce output quality, but the service should remain explicit about the domain lifecycle evidence still being separate from identity and notification infrastructure ownership.

## Validation
- `python3 intent-preservation-system/scripts/validate_adoption_profile.py --root domain-research --phase planning`
- Build, test, docs audit, and deployment-readiness gates remain the service-level acceptance test for valid operation.
