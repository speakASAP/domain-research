# domain-research

## Status
Status: active
Lifecycle: production-ready research service
Domain Research helps Alfares teams generate candidate domains, check availability through RDAP-first evidence, and monitor watched domains for re-availability.

## Documentation authority
This repository contains the authoritative source material for the Domain Research service boundary, workflow, and operational contract. The shared IPS repository remains the governance standard for repo adoption and validation.

## Capabilities
- auth: required — The service validates bearer tokens for authenticated watch endpoints and user-owned domain watches.
- postgres: required — A PostgreSQL database stores domain suggestion jobs, candidate records, watch state, availability evidence, and notification records.
- redis: not-applicable — No Redis cache is required for the current service implementation.
- logging: required — The service emits structured logs through the platform logging flow.
- notifications: required — The service dispatches notifications via notifications-microservice after recheck events and watch updates.
- ai: required — The service calls ai-microservice for domain suggestion expansion and candidate generation.
- payments: not-applicable — No payment or purchase processing is part of the service’s current scope.
- catalog: not-applicable — Domain Research is not the catalog service and does not own product catalog state.
- orders: not-applicable — Order processing is outside the repo boundary.
- warehouse: not-applicable — Inventory and stock ownership are outside this service.
- invoices: not-applicable — Invoice generation and payment operations are outside this repo.
- object-storage: not-applicable — No object-storage runtime is required here.
- event-bus: not-applicable — The service does not own a shared event-bus producer/consumer contract for the current workload.
- docs-rag: required — The repo participates in the documentation and service-discovery flow for cross-ecosystem knowledge retrieval.
- monitoring: required — The service exposes health and deployment readiness signals to the platform monitoring flow.
- backups: required — The Postgres-backed domain research dataset should be included in platform backup coverage.

## Interfaces
- Public service domain: https://domain-research.alfares.cz
- Service port: 4860
- Health endpoint: GET /health
- Domain suggestion APIs: POST /api/domain-suggestions, GET /api/domain-suggestions/:id
- Availability APIs: POST /api/availability/check
- Watch APIs: POST /api/watches, GET /api/watches, PATCH /api/watches/:id, GET /api/watches/:id/history
- Internal job APIs: POST /api/internal/jobs/expiry-recheck/run-due, POST /api/internal/jobs/notification-dispatch/run-due
- Upstream dependencies: ai-microservice, notifications-microservice, logging-microservice, auth-microservice, Vault, Postgres

## Development
- Stack: NestJS, TypeScript, TypeORM, PostgreSQL
- Source of truth: repository-local code, scripts, and service configuration
- Validation: build, test, docs audit, pre-coding gate, deployment readiness gate
- Standard commands: npm run build, npm test, npm run docs:audit, npm run gate:pre-coding, npm run gate:deployment

## Configuration
- Secrets are stored in Vault at `secret/prod/domain-research` and synced through External Secrets Operator.
- Database and runtime configuration remain repository-local and environment-managed.
- The service uses the platform auth and notifications flows rather than creating a parallel identity or messaging system.

## Deployment
- Deployment mode: Kubernetes in the `statex-apps` namespace
- Deploy entrypoint: `./scripts/deploy.sh`
- Public URL: https://domain-research.alfares.cz
- Runtime health: the service exposes /health and should remain ready for scheduled domain checks, watch rechecks, and notifications.

## Health and observability
- Health endpoint: GET /health
- Logs: structured logs via logging-microservice
- Operational checks: build/test/docs audit and deployment readiness gates remain required before deployment
- Watch and notification workflows rely on repeatable evidence from availability checks and scheduled rechecks rather than ad hoc assumptions.
